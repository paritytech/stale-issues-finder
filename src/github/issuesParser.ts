import { GitHub } from "@actions/github/lib/utils";
import moment from "moment";

export interface IssueData {
    html_url: string;
    title: string;
    created_at: string;
    updated_at: string;
    number: number;
}

interface Repo {
    owner: string,
    repo: string;
}

export const fetchIssues = async (octokit: InstanceType<typeof GitHub>, daysStale: number, repo: Repo): Promise<IssueData[]> => {
    const issues = await octokit.rest.issues.listForRepo({ ...repo, per_page: 100 });
    console.log("Found elements", issues.data.length);

    // filter old actions
    const filtered = issues.data.filter(od => moment().diff(moment(od.updated_at), "days") > daysStale);

    // order them from stalest to most recent
    const orderedDates = filtered.sort((a, b) => {
        return b.updated_at > a.updated_at ? -1 : b.updated_at < a.updated_at ? 1 : 0
    });

    let days = orderedDates.map(od => moment().diff(moment(od.updated_at), 'days'));
    return orderedDates;
}
