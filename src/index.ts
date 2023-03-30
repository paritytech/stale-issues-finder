import { getInput, setOutput } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { Context } from "@actions/github/lib/context";
import moment from "moment";
import { fetchIssues, IssueData } from "./github/issuesParser";

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
    const repo = getInput("repo", { required: false });
    const owner = getInput("owner", { required: false });

    if (repo && owner) {
        return { repo, owner };
    } else {
        return ctx.repo;
    }
}

const runAction = async (ctx: Context) => {
    const repo = getRepo(ctx);
    const token = getInput("GITHUB_TOKEN", { required: true });
    const inputDays = Number.parseInt(getInput("days-stale", { required: false }));
    const daysStale = isNaN(inputDays) ? 5 : inputDays;
    const stale = isNaN(daysStale);
    console.log("daysStale", daysStale, stale);

    const octokit = getOctokit(token);
    const staleIssues = await fetchIssues(octokit, daysStale, repo);

    const cleanedData = staleIssues.map(issue => {
        return {
            url: issue.html_url,
            title: issue.title,
            daysStale: daysSinceDate(issue.updated_at)
        }
    });

    setOutput("repo", `${repo.owner}/${repo.repo}`);
    setOutput("stale", JSON.stringify(cleanedData));
    const message = generateMarkdownMessage(staleIssues, repo);
    setOutput("message", message);
}

runAction(context);
