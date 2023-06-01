import moment from "moment";

export const olderThanDays = (issue: IssueData, daysStale: number): boolean =>
  moment().diff(moment(issue.updated_at), "days") > daysStale;

export const byNoComments = (issue: IssueData): boolean => issue.comments === 0;

export const isNotFromAuthor = ({ user }: IssueData, authors: string[]): boolean =>
  !authors.some((author) => author.toLowerCase() === user?.login.toLowerCase());

export const byLabels = (issue: IssueData, labels: string[]): boolean =>
  issue.labels?.map((l) => l.name.toLowerCase()).some((l) => labels.map((lb) => lb.toLowerCase()).includes(l));
