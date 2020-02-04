import * as settings from '../settings'
import { dbFilename } from '../../shared/paths'
import { DumpManager } from '../../shared/store/dumps'
import { TracingContext, logAndTraceCall } from '../../shared/tracing'
import { ConnectionCache, DocumentCache, ResultChunkCache } from '../backend/cache'
import { Database } from '../backend/database'
import { Connection } from 'typeorm'

/**
 * Updates all dump records with an empty extensions list with the unique
 * extensions in their database. This may take a while on large instances
 * as each database is opened sequentially.
 *
 * @param ctx The tracing context.
 * @param connection The Postgres connection.
 * @param dumpManager The dump manager.
 */
export function extractFileExtensions(
    ctx: TracingContext,
    connection: Connection,
    dumpManager: DumpManager
): Promise<void> {
    return logAndTraceCall(ctx, 'Populating extensions column for completed uploads', async () => {
        const connectionCache = new ConnectionCache(settings.CONNECTION_CACHE_CAPACITY)
        const documentCache = new DocumentCache(settings.DOCUMENT_CACHE_CAPACITY)
        const resultChunkCache = new ResultChunkCache(settings.RESULT_CHUNK_CACHE_CAPACITY)

        for (const dump of await dumpManager.getDumps()) {
            if (dump.extensions.length > 0) {
                continue
            }

            const db = new Database(
                connectionCache,
                documentCache,
                resultChunkCache,
                dump,
                dbFilename(settings.STORAGE_ROOT, dump.id)
            )

            const extensions = Array.from(await db.extensions())
            extensions.sort()
            dump.extensions = extensions
            await connection.createEntityManager().save(dump)
        }

        await connectionCache.close()
        await documentCache.close()
        await resultChunkCache.close()
    })
}
