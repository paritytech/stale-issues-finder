import moment from "moment";

export const olderThanDays = (issue: IssueData, daysStale: number) => {
    return  moment().diff(moment(issue.updated_at), "days") > daysStale;
}

export const byNoComments = (issue:IssueData) => {
    return issue.comments === 0;
}
