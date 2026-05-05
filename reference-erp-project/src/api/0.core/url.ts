export const baseApiUrl =
    localStorage.getItem("main-api-url") === "dev"
        ? process.env.REACT_APP_MAIN_API_URL_DEV
        : process.env.REACT_APP_MAIN_API_URL;
