import { debug } from "@actions/core";
import { GitHub } from "@actions/github/lib/utils";
import moment from "moment";

export const fetchIssues = async (octokit: InstanceType<typeof GitHub>, daysStale: number, repo: Repo): Promise<IssueData[]> => {
    const issues = await octokit.rest.issues.listForRepo({ ...repo, per_page: 100, state: "open" });
    debug(`Found elements ${issues.data.length}`);

    // filter old actions
    const filtered = issues.data.filter(od => moment().diff(moment(od.updated_at), "days") > daysStale);
    if (filtered.length < 1) {
        return []
    }

    // order them from stalest to most recent
    const orderedDates = filtered.sort((a, b) => {
        return b.updated_at > a.updated_at ? -1 : b.updated_at < a.updated_at ? 1 : 0
    });
    return orderedDates;
}

export const filterByDays =(issues:IssueData[], daysStale:number) => {
    return issues.filter(issue => moment().diff(moment(issue.updated_at), "days") > daysStale);
}
