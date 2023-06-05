import moment from "moment";

export const olderThanDays = (issue: IssueData, daysStale: number): boolean =>
  moment().diff(moment(issue.updated_at), "days") > daysStale;

export const byNoComments = (issue: IssueData): boolean => issue.comments === 0;

export const isNotFromAuthor = ({ user }: IssueData, authors: string[]): boolean =>
  !authors.some((author) => author.toLowerCase() === user?.login.toLowerCase());

export const byLabels = (issue: IssueData, requiredLabels: string[]): boolean =>
  issue.labels?.map((l) => l.name.toLowerCase()).some((l) => requiredLabels.map((lb) => lb.toLowerCase()).includes(l));
