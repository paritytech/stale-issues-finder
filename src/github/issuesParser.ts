import { debug } from "@actions/core";
import { GitHub } from "@actions/github/lib/utils";
import moment from "moment";

//** Handles the problem of pagination */
const getAllIssues = async (octokit: InstanceType<typeof GitHub>, repo: Repo): Promise<IssueData[]> => {
    const { data } = await octokit.rest.issues.listForRepo({ ...repo, per_page: 100, state: "open" });
    let issues = data;
    if (issues.length > 99) {
        let fullPage = issues.length > 99;
        let currentPage = 2;
        while (fullPage) {
            const { data } = await octokit.rest.issues.listForRepo({ ...repo, per_page: 100, page: currentPage, state: "open" });
            issues = issues.concat(data);
            fullPage = data.length > 99;
            currentPage++;
        }
    }
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
