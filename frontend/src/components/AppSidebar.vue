<script setup lang="ts">
import type { SidebarProps } from '@/components/ui/sidebar'
import { SquareTerminal, TrendingUp, Target, BarChart3, FileBarChart } from "lucide-vue-next"
import NavMain from '@/components/NavMain.vue'
import NavUser from '@/components/NavUser.vue'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from '@/components/ui/sidebar'
import { useAuth } from '@/composables/useAuth'
import { computed } from 'vue'

const { user: authUser, can } = useAuth()

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: "icon",
})

const data = computed(() => {
  const adminItems = [
    {
      title: "Users",
      url: "/users",
      action: "view",
      subject: "User"
    },
    {
      title: "Roles",
      url: "/roles",
      action: "view",
      subject: "Role"
    },
    {
      title: "Permissions",
      url: "/permissions",
      action: "view",
      subject: "Permission"
    },
  ].filter(item => can(item.action, item.subject))

  const navMain = []

  const menus = [
    {
      title: "Forecast",
      url: "/forecast",
      icon: TrendingUp,
      action: "view",
      subject: "Forecast",
    },
    {
      title: "Summary",
      url: "/summary",
      icon: BarChart3,
      action: "view",
      subject: "Summary",
    },
    {
      title: "Reports",
      url: "/reports",
      icon: FileBarChart,
      action: "view",
      subject: "Report",
    },
    {
      title: "Targets",
      url: "/targets",
      icon: Target,
      action: "view",
      subject: "Target",
    },
  ].filter(item => can(item.action, item.subject))

  navMain.push(...menus)

  // if (can('view', 'Dashboard')) {
  // }

  if (adminItems.length > 0) {
    navMain.push({
      title: "Administrator",
      url: "",
      icon: SquareTerminal,
      items: adminItems,
    })
  }

  return {
    navMain,
  }
})
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarContent>
      <NavMain :items="data.navMain" />
    </SidebarContent>
    <SidebarFooter v-if="authUser">
      <NavUser :user="{
        name: authUser.name,
        email: authUser.username,
        avatar: ''
      }" />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
