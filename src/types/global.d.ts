declare global {
  interface IssueData {
    html_url: string;
    title: string;
    created_at: string;
    updated_at: string;
    number: number;
    comments: number;
    /** If user was deleted it is going to be null */
    user: { login: string } | null;
    labels: Label[];
  }

  interface Repo {
    owner: string;
    repo: string;
  }

  interface Filters {
    noComments?: boolean;
    daysStale: number;
    notFromAuthor: string[];
    requiredLabels: string[];
  }

  interface Label {
    id: number;
    url: string;
    name: string;
    description: string;
  }
}

export {};
