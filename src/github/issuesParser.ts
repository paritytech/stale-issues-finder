import { debug } from "@actions/core";
import { GitHub } from "@actions/github/lib/utils";
import moment from "moment";

export const fetchIssues = async (octokit: InstanceType<typeof GitHub>, repo: Repo): Promise<IssueData[]> => {
    const issues = await octokit.rest.issues.listForRepo({ ...repo, per_page: 100, state: "open" });
    debug(`Found elements ${issues.data.length}`);

    // order them from stalest to most recent
    const orderedDates = issues.data.sort((a, b) => {
        return b.updated_at > a.updated_at ? -1 : b.updated_at < a.updated_at ? 1 : 0
    });

    return orderedDates;
}

export const filterByDays = (issues: IssueData[], daysStale: number) => {
    return issues.filter(issue => moment().diff(moment(issue.updated_at), "days") > daysStale);
}
