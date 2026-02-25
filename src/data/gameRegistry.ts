const games: Record<string, () => Promise<any>> = {
    "spinning-cube": () => import("../content/games/spinning-cube"),
};

export default games;