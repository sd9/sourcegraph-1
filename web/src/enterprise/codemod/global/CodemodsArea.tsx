import MapSearchIcon from 'mdi-react/MapSearchIcon'
import React from 'react'
import { Route, RouteComponentProps, Switch } from 'react-router'
import { ExtensionsControllerProps } from '../../../../../shared/src/extensions/controller'
import { HeroPage } from '../../../components/HeroPage'
import { ThreadsAreaContext } from '../../threads/global/ThreadsArea'
import { CodemodsOverviewPage } from '../overview/CodemodsOverviewPage'
import { NewCodemodThreadPage } from '../threads/new/NewCodemodThreadPage'

const NotFoundPage: React.FunctionComponent = () => (
    <HeroPage icon={MapSearchIcon} title="404: Not Found" subtitle={`Sorry, the requested page was not found.`} />
)

/**
 * Properties passed to all page components in the codemods area.
 */
export interface CodemodsAreaContext extends ThreadsAreaContext {}

export interface ThreadsAreaProps
    extends Pick<CodemodsAreaContext, 'isLightTheme'>,
        RouteComponentProps<{}>,
        ExtensionsControllerProps {}

/**
 * The global codemods area.
 */
export const CodemodsArea: React.FunctionComponent<ThreadsAreaProps> = ({ match, ...props }) => {
    const context: CodemodsAreaContext = {
        ...props,
        type: 'codemod',
    }

    return (
        <div className="container mt-3">
            <Switch>
                <Route
                    path={match.url}
                    key="hardcoded-key" // see https://github.com/ReactTraining/react-router/issues/4578#issuecomment-334489490
                    exact={true}
                    // tslint:disable-next-line:jsx-no-lambda
                    render={routeComponentProps => <CodemodsOverviewPage {...routeComponentProps} {...context} />}
                />
                <Route
                    path={`${match.url}/new`}
                    key="hardcoded-key" // see https://github.com/ReactTraining/react-router/issues/4578#issuecomment-334489490
                    // tslint:disable-next-line:jsx-no-lambda
                    render={routeComponentProps => <NewCodemodThreadPage {...routeComponentProps} {...context} />}
                />
                <Route key="hardcoded-key" component={NotFoundPage} />
            </Switch>
        </div>
    )
}