import moment from "moment";

export const olderThanDays = (issue: IssueData, daysStale: number): boolean => {
    return moment().diff(moment(issue.updated_at), "days") > daysStale;
}

export const byNoComments = (issue: IssueData): boolean => {
    return issue.comments === 0;
}

export const isNotFromAuthor = ({ user }: IssueData, authors: string[]): boolean => {
    return !authors.some(author => author.toLowerCase() === user?.login.toLowerCase());
}
