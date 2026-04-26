import { createRouter } from "@tanstack/react-router";
import { DefaultErrorComponent } from "./components/app/DefaultErrorComponent";
import { getAppBasepath } from "./lib/basepath";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    basepath: getAppBasepath(),
    context: {},
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent,
  });

  return router;
};
