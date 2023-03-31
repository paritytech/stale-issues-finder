# Stale Issue Finder 
Finds outdated issues and generates an output data & message.

Intended to be used with a notification action (Slack/Discord/Email/etc look at the example usage).

Works great with the [`workflow_dispatch`](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch) or [`schedule`](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule) action events.

## Why?

This action is intended for the case where a repository (or an organization) needs to find out what issues have been stale for a while.

By being agnostic on the result, users can use the output to generate a custom message on their favorite system.

## Example usage

You need to create a file in `.github/workflows` and add the following:

```yml
name: Find stale issues

on:
  workflow_dispatch:

jobs:
  fetch:
    permissions:
        issues: read
    runs-on: ubuntu-latest
    steps:
      - name: Fetch issues from here
        # We add the id to access to this step outputs
        id: stale
        uses: paritytech/stale-issues-finder@main
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # optional, how many days since the last action for it to be stale
          # defaults to 5
          days-stale: 10
        # example showing how to use the content
      - name: Produce result
        run: |
          echo "There are $AMOUNT stale issues in this repository"
          echo "$ACTION_ISSUES"
        env:
          # a number with the amount of stale issues in the repository
          AMOUNT: ${{ steps.stale.outputs.stale }}"
          # a formatted markdown message
          ACTION_ISSUES: ${{ steps.stale.outputs.message }}"
```

### Inputs
You can find all the inputs in [the action file](./action.yml) but let's walk through each one of them:

- `GITHUB_TOKEN`: Token to access to the repository issues. If you are refering to a different repository this need to be a PERSONAL ACCESS TOKEN
  - **required**
  - If using on the same repo, you can simply use `${{ github.token }}`.
- `repo`: name of the repository. Example: `https://github.com/paritytech/REPO-NAME-GOES-HERE`
  - **defaults** to the repo where this action is ran.
  - If set, you also need to set `owner`.
  - Setting this value and `owner` allows you to run this action in other repositories (useful if you want to aggregate all the stale issues)
  - If set, be sure that the `GITHUB_TOKEN` is a Personal Access Token, as the repository's default token can not access other (private) repos.
- `owner`: name of the organization/user where the repository is. Example: `https://github.com/OWNER-NAME/stale-issues-finder`
  - **defaults** to the organization where this action is ran.
  - If set, you also need to set `repo`. 
- `days-stale`: Amount of days since the last activity for an issue to be considered *stale*.
  - **default**: 5

### Outputs
Outputs are needed for your chained actions. If you want to use this information, remember to set an `id` field in the step so you can access it.
You can find all the outputs in [the action file](./action.yml) but let's walk through each one of them:
- `stale`: Amount of stale issues found in the step. It's only the number (`0`, `4`, etc)
- `repo`: Organization and repo name. Written in the format of `owner/repo`.
- `message`: A markdown message with a list of all the stale issues. See the example below.
  - If no stale issues were found, it will be `## Repo owner/repo has no stale issues` instead.
- `data`: A json object with the data of the stale issues. See the example below for the format of the data.

**The `message` and `data` objects are sorted from oldest last change to newest.**

#### Markdown message

An example of how the markdown would be produced for this repository:
### Repo paritytech/action-project-sync has 3 stale issues
  - [Stop AI from controlling the world](https://github.com/paritytech/stale-issues-finder/issues/15) - Stale for 25 days
  - [Lint the repo](https://github.com/paritytech/stale-issues-finder/issues/12) - Stale for 21 days
  - [Help me with reading](https://github.com/paritytech/stale-issues-finder/issues/3) - Stale for 18 days

You can send the data in this format to a Slack/Discord/Matrix server. You can also create a new GitHub issue with this format.

#### JSON Data
```json
[
    {
        "url": "https://github.com/paritytech/stale-issues-finder/issues/15",
        "title": "Stop AI from controlling the world",
        "daysStale": "25"
    },
    {
        "url": "https://github.com/paritytech/stale-issues-finder/issues/12",
        "title": "Lint the repo",
        "daysStale": "21"
    },
    {
        "url": "https://github.com/paritytech/stale-issues-finder/issues/3",
        "title": "Help me with reading",
        "daysStale": "18"
    }
]
```

### Using a GitHub app instead of a PAT
In some cases, specially in big organizations, it is more organized to use a GitHub app to authenticate, as it allows us to give it permissions per repository and we can fine-grain them even better. If you wish to do that, you need to create a GitHub app with the following permissions:
- Repository permissions:
	- Issues
		- [x] Read

Because this project is intended to be used with a token we need to do an extra step to generate one from the GitHub app:
- After you create the app, copy the *App ID* and the *private key* and set them as secrets.
- Then you need to modify the workflow file to have an extra step:
```yml
    steps:
      - name: Generate token
        id: generate_token
        uses: tibdex/github-app-token@v1
        with:
          app_id: ${{ secrets.APP_ID }}
          private_key: ${{ secrets.PRIVATE_KEY }}
      - name: Fetch issues from here
        id: stale
        uses: paritytech/stale-issues-finder@main
        with:
          days-stale: 10
          # The previous step generates a token which is used as the input for this action
          GITHUB_TOKEN: ${{ steps.generate_token.outputs.token }}
```

Be aware that this is needed only to read issues from **external private repositories**. 
If the issue is in the same repository, or the target repository is public, the default `${{ github.token }}` has enough access to read the issues.

## Example workflow

Let's make an example. We want to have a workflow that runs every Monday at 9 in the morning and it informs through a slack message in a channel. We can also trigger it manually if we want to.

This issue needs to run on 3 different repositories:
- The current repository
- `example/abc` repository
- `example/xyz` repository

```yml
name: Find stale issues

on:
  workflow_dispatch:
  schedule:
    - cron:  '0 9 * * 1'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Fetch issues from here
        id: local
        uses: paritytech/stale-issues-finder@main
        with:
          GITHUB_TOKEN: ${{ github.token }}
      - name: Fetch abc issues
        id: abc
        uses: paritytech/stale-issues-finder@main
        with:
          GITHUB_TOKEN: ${{ github.token }}
          owner: example
          repo: abc
      - name: Fetch xyz issues
        id: polkadot
        uses: paritytech/stale-issues-finder@main
        with:
          GITHUB_TOKEN: ${{ github.token }}
          owner: example
          repo: xyz
      - name: Post to a Slack channel
        id: slack
        uses: slackapi/slack-github-action@v1.23.0
        with:
          channel-id: 'CHANNEL_ID,ANOTHER_CHANNEL_ID'
          slack-message: "Stale issues this week: \n$LOCAL_ISSUES \n$ABC_ISSUES \n$XYZ_ISSUES"
        env:
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
          LOCAL_ISSUES: ${{ steps.local.outputs.message }}"
          ABC_ISSUES: ${{ steps.abc.outputs.message }}"
          XYZ_ISSUES: ${{ steps.xyz.outputs.message }}"
```

This will produce a message similar to the following:

Stale issues this week:
### Repo example/local has 1 stale issues
  - [Stop AI from controlling the world](https://github.com/example/local/issues/15) - Stale for 25 days
### Repo example/abc has 2 stale issues
  - [Lint the repo](https://github.com/example/abc/issues/12) - Stale for 21 days
  - [Help me with reading](https://github.com/example/abc/issues/3) - Stale for 18 days
### Repo example/xyz has 3 stale issues
  - [La la la](https://github.com/example/xyz/issues/15) - Stale for 25 days
  - [Help with lalilulelo](https://github.comexample/xyz/issues/12) - Stale for 21 days
  - [Fix the issue with the word 'Patriot'](https://github.com/example/xyz/issues/3) - Stale for 18 days

## Development
To work on this app, you require
- `Node 18.x`
- `yarn`
Use `yarn install` to set up the project.
`yarn test` runs the unit tests.
`yarn build` compiles the TypeScript code to JavaScript.
