declare global {
    interface IssueData {
        html_url: string;
        title: string;
        created_at: string;
        updated_at: string;
        number: number;
        comments: number;
        user: { login: string }
    }

    interface Repo {
        owner: string,
        repo: string;
    }

    interface Filters {
        noComments?: boolean;
        daysStale: number;
        notFromAuthor: string[];
    }
}

export { } 
