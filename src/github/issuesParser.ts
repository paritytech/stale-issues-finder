import { debug } from "@actions/core";
import { GitHub } from "@actions/github/lib/utils";
import moment from "moment";

const listForRepo = (octokit: InstanceType<typeof GitHub>, repo: Repo, per_page: number = 100, page: number = 1) => {
    return octokit.rest.issues.listForRepo({ ...repo, per_page, state: "open", page });
}

//** Handles the problem of pagination */
const getAllIssues = async (octokit: InstanceType<typeof GitHub>, repo: Repo): Promise<IssueData[]> => {
    const perPage = 100;
    let currentPage = 1;
    const { data } = await listForRepo(octokit, repo, perPage, currentPage);

    // GitHub's REST API v3 considers every pull request an issue so we need to get objects without the PR key
    let issues = data.filter(data => !data.pull_request);
    let fullPage = issues.length > 99;
    while (fullPage) {
        currentPage++;
        debug(`Iterating on page ${currentPage} with ${issues.length} issues`);
        const { data } = await listForRepo(octokit, repo, perPage, currentPage)
        issues = issues.concat(data);
        fullPage = data.length > 99;
    }

    debug(`Found a total of ${issues.length} issues`);
    return issues;
}

export const fetchIssues = async (octokit: InstanceType<typeof GitHub>, repo: Repo): Promise<IssueData[]> => {
    const issues = await getAllIssues(octokit, repo);
    debug(`Found elements ${issues.length}`);

    // order them from stalest to most recent
    const orderedDates = issues.sort((a, b) => {
        return b.updated_at > a.updated_at ? -1 : b.updated_at < a.updated_at ? 1 : 0
    });

    return orderedDates;
}

export const filterByDays = (issues: IssueData[], daysStale: number) => {
    return issues.filter(issue => moment().diff(moment(issue.updated_at), "days") > daysStale);
}
