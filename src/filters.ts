import { moment } from "moment";
import { IssueData } from "./types.ts";

export const olderThanDays = (issue: IssueData, daysStale: number): boolean =>
  moment().diff(moment(issue.updated_at), "days") > daysStale;

export const byNoComments = (issue: IssueData): boolean => issue.comments === 0;

export const isNotFromAuthor = ({ user }: IssueData, authors: string[]): boolean =>
  !authors.some((author) => author.toLowerCase() === user?.login.toLowerCase());
