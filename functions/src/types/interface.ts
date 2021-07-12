export interface ContentfulConfig {
    space: string,
    accessToken: string
}

export type SLACK_NOTIFICATION_TYPE = "SERVER" | "CONTENTFUL"

export interface SLACK_NOTIFICATION {
    name: string
    message: string
    function?: unknown
}

export interface PortfolioWork {
    image: {
        sys: {
            type: "Link",
            linkType: "Asset",
            id: string
        }
    },
    title: string,
    description: string,
    link: string,
    github: string,
    created_year: number,
}

export interface BlogCategory {
    categoryName: string,
    categoryId: string,
    color: string,
    priority: number
}
