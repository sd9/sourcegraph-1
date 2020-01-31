package backend

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/Masterminds/semver"
	"github.com/keegancsmith/sqlf"
	"github.com/sourcegraph/sourcegraph/internal/db/dbconn"
	"github.com/sourcegraph/sourcegraph/internal/db/dbutil"
)

// UpdateServiceVersion updates the latest version for the given Sourcegraph
// service. It enforces our documented upgrade policy.
// https://docs.sourcegraph.com/#upgrading-sourcegraph
func UpdateServiceVersion(ctx context.Context, service string, latest *semver.Version) error {
	return dbutil.Transaction(ctx, dbconn.Global, func(tx *sql.Tx) (err error) {
		var v string

		q := sqlf.Sprintf(`select version where service = %s`, service)
		row := tx.QueryRowContext(ctx, q.Query(sqlf.PostgresBindVar), q.Args()...)
		if err = row.Scan(&v); err != nil && err != sql.ErrNoRows {
			return err
		}

		var previous *semver.Version
		if v != "" {
			previous, err = semver.NewVersion(v)
			if err != nil {
				return err
			}
		}

		if !IsValidUpgrade(previous, latest) {
			return fmt.Errorf("%q upgrade policy violation error, please refer to https://docs.sourcegraph.com/#upgrading-sourcegraph", service)
		}

		const upsert = `insert into versions (service, version, updated_at)` +
			`values (%s, %s, %s) on conflict do` +
			`update set (version, updated_at) = (excluded.version, excluded.updated_at)`

		q = sqlf.Sprintf(upsert, service, latest.String(), time.Now().UTC())
		_, err = tx.ExecContext(ctx, q.Query(sqlf.PostgresBindVar), q.Args()...)
		return err
	})
}

// IsValidUpgrade returns true if the given previous and
// latest versions comply with our documented upgrade policy.
//
// https://docs.sourcegraph.com/#upgrading-sourcegraph
func IsValidUpgrade(previous, latest *semver.Version) bool {
	return previous == nil ||
		(previous.Major() == latest.Major() &&
			previous.Minor() == latest.Minor()-1) ||
		(previous.Major() == latest.Major()+1 &&
			latest.Minor() == 0)
}
