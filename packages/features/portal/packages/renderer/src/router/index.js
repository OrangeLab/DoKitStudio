import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  // {
  //   path: "/portal",
  //   name: "portal",
  //   component: () =>
  //     import(/* webpackChunkName: "about" */ "../views/HomeView.vue"),
  // },
  {
    path: "/",
    name: "portal",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/HomeView.vue"),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
