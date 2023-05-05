export interface IssueData {
    html_url: string;
    title: string;
    created_at: string;
    updated_at: string;
    number: number;
    comments: number;
    /** If user was deleted it is going to be null */
    user: { login: string } | null;
}

export interface Repo {
    owner: string;
    repo: string;
}

export interface Filters {
    noComments?: boolean;
    daysStale: number;
    notFromAuthor: string[];
}
