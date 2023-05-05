import { debug, getBooleanInput, getInput, info, setOutput, summary } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { moment } from "moment";

import { byNoComments, isNotFromAuthor, olderThanDays } from "./filters.ts";
import { fetchIssues } from "./github/issuesParser.ts";

const daysSinceDate = (date: string): number => moment().diff(moment(date), "days");

const getFiltersFromInput = (): Filters => {
  const inputDays = Number.parseInt(getInput("days-stale", { required: false }));
  const daysStale = isNaN(inputDays) ? 5 : inputDays;

  const noComments = getInput("noComments") ? getBooleanInput("noComments") : false;

  let ignoreAuthors: string[] = [];
  const authorsToIgnore = getInput("ignoreAuthors");
  if (authorsToIgnore) {
    ignoreAuthors = authorsToIgnore.split(",");
  }

  return { daysStale, noComments, notFromAuthor: ignoreAuthors };
};

const generateMarkdownMessage = (issues: IssueData[], repo: { owner: string; repo: string }) => {
  const messages = issues.map(
    (issue) => `  - [${issue.title}](${issue.html_url}) - Stale for ${daysSinceDate(issue.updated_at)} days`,
  );
  return `### Repo ${repo.owner}/${repo.repo} has ${issues.length} stale issues\n${messages.join("\n")}`;
};

const getRepo = (ctx: Repo): { owner: string; repo: string } => {
  let repo = getInput("repo", { required: false });
  if (!repo) {
    repo = ctx.repo;
  }

  let owner = getInput("owner", { required: false });
  if (!owner) {
    owner = ctx.owner;
  }

  return { repo, owner };
};

const filterIssues = (issues: IssueData[] | undefined, filters: Filters) => {
  if (!issues || issues.length < 1) {
    return [];
  }

  let filteredData = issues;
  if (filters.daysStale) {
    filteredData = filteredData.filter((is) => olderThanDays(is, filters.daysStale));
  }
  if (filters.noComments) {
    filteredData = filteredData.filter(byNoComments);
  }
  if (filters.notFromAuthor.length > 0) {
    filteredData = filteredData.filter((is) => isNotFromAuthor(is, filters.notFromAuthor));
  }

  return filteredData;
};

const runAction = async (repo: Repo) => {
  const token = getInput("GITHUB_TOKEN", { required: true });

  const filters = getFiltersFromInput();
  debug(JSON.stringify(filters));

  const octokit = getOctokit(token);
  const staleIssues = await fetchIssues(octokit, repo);

  // we filter the issues and see how many are remaining
  const filteredIssues = filterIssues(staleIssues, filters);

  const amountOfStaleIssues = filteredIssues.length;

  info(`Found ${amountOfStaleIssues} stale issues.`);
  setOutput("repo", `${repo.owner}/${repo.repo}`);
  setOutput("stale", amountOfStaleIssues);

  if (amountOfStaleIssues > 0) {
    const cleanedData = filteredIssues.map((issue) => {
      return {
        url: issue.html_url,
        title: issue.title,
        daysStale: daysSinceDate(issue.updated_at),
        number: issue.number,
      };
    });

    const jsonData = JSON.stringify(cleanedData);
    setOutput("data", jsonData);
    debug(jsonData);
    const message = generateMarkdownMessage(filteredIssues, repo);
    setOutput("message", message);

    await summary
      .addHeading(`${repo.owner}/${repo.repo}`)
      .addHeading(`${amountOfStaleIssues} stale issues`, 3)
      .addTable([
        [
          { data: "Title", header: true },
          { data: "Days stale", header: true },
          { data: "Link", header: true },
        ],
        ...cleanedData.map(
          (issue) =>
            [issue.title, issue.daysStale.toString(), `${repo.owner}/${repo.repo}#${issue.number}`] as string[],
        ),
      ])
      .addLink("See all issues", `https://github.com/${repo.owner}/${repo.repo}/issues`)
      .write();
  } else {
    setOutput("message", `### Repo ${repo.owner}/${repo.repo} has no stale issues`);
    info(`Repo ${repo.owner}/${repo.repo} has no stale issues`);
  }
};

const repo = getRepo(context.repo);
runAction(repo);
