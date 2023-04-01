import { getBooleanInput, getInput, getMultilineInput, info, setOutput } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { Context } from "@actions/github/lib/context";
import moment from "moment";
import { byNoComments, isNotFromAuthor, olderThanDays } from "./filters";
import { fetchIssues } from "./github/issuesParser";

const daysSinceDate = (date: string): number => {
    return moment().diff(moment(date), 'days')
}

const generateMarkdownMessage = (issues: IssueData[], repo: { owner: string, repo: string; }) => {
    const messages = issues.map(issue => {
        return `  - [${issue.title}](${issue.html_url}) - Stale for ${daysSinceDate(issue.updated_at)} days`;
    });
    const markdownMessage = `### Repo ${repo.owner}/${repo.repo} has ${issues.length} stale issues\n${messages.join("\n")}`;
    return markdownMessage;
}

const getRepo = (ctx: Context): { owner: string, repo: string } => {
    let repo = getInput("repo", { required: false });
    if (!repo) {
        repo = ctx.repo.repo;
    }

    let owner = getInput("owner", { required: false });
    if (!owner) {
        owner = ctx.repo.owner;
    }

    return { repo, owner };
}

const filterIssues = (issues: IssueData[], filters: Filters) => {
    let filteredData = issues;
    if (filters.daysStale) {
        filteredData = filteredData.filter(is => olderThanDays(is, filters.daysStale));
    }
    if (filters.noComments) {
        filteredData = filteredData.filter(byNoComments);
    }
    if (filters.notFromAuthor && filters.notFromAuthor.length > 0) {
        filteredData = filteredData.filter(is => isNotFromAuthor(is, filters.notFromAuthor));
    }

    return filteredData;
}

const runAction = async (ctx: Context) => {
    const repo = getRepo(ctx);
    const token = getInput("GITHUB_TOKEN", { required: true });

    const noComments = !!getInput("noComments") ? getBooleanInput("noComments") : false;
    const ignoreAuthors = getMultilineInput("ignoreAuthors");
    const inputDays = Number.parseInt(getInput("days-stale", { required: false }));
    const daysStale = isNaN(inputDays) ? 5 : inputDays;

    const octokit = getOctokit(token);
    const staleIssues = await fetchIssues(octokit, daysStale, repo);

    const amountOfStaleIssues = staleIssues.length;

    info(`Found ${amountOfStaleIssues} stale issues.`);
    setOutput("repo", `${repo.owner}/${repo.repo}`);
    setOutput("stale", amountOfStaleIssues);

    if (amountOfStaleIssues > 0) {
        const filteredData = filterIssues(staleIssues, { noComments, daysStale, notFromAuthor: ignoreAuthors });

        let cleanedData = filteredData.map(issue => {
            return {
                url: issue.html_url,
                title: issue.title,
                daysStale: daysSinceDate(issue.updated_at)
            }
        });

        setOutput("data", JSON.stringify(cleanedData));
        const message = generateMarkdownMessage(staleIssues, repo);
        setOutput("message", message);
    } else {
        setOutput("message", `### Repo ${repo.owner}/${repo.repo} has no stale issues`);
    }
}

runAction(context);
