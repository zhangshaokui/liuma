"use client";
import { SidebarMenuButton } from "ui/sidebar";
import { Tooltip } from "ui/tooltip";
import { SidebarMenu, SidebarMenuItem } from "ui/sidebar";
import { SidebarGroupContent } from "ui/sidebar";

import { SidebarGroup } from "ui/sidebar";
import Link from "next/link";
import {
  BriefcaseIcon,
  SearchIcon,
  UsersIcon,
  BarChart3Icon,
  BookOpenIcon,
  ZapIcon,
  StoreIcon,
} from "lucide-react";
import { getIsUserAdmin } from "lib/user/utils";
import { BasicUser } from "app-types/user";
import { AppSidebarAdmin } from "./app-sidebar-menu-admin";

export function AppSidebarMenus({ user }: { user?: BasicUser }) {

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        {/* AI员工 (原 Super Employee) */}
        <SidebarMenu>
          <Tooltip>
            <SidebarMenuItem>
              <Link href="/super-employee">
                <SidebarMenuButton className="font-semibold">
                  <BriefcaseIcon className="size-4 text-primary" />
                  AI员工
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </Tooltip>
        </SidebarMenu>

        {/* 新增tab项 */}
        <SidebarMenu>
          <Tooltip>
            <SidebarMenuItem>
              <Link href="/lead-mining">
                <SidebarMenuButton className="font-semibold">
                  <SearchIcon className="size-4 text-blue-500" />
                  线索挖掘
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </Tooltip>
        </SidebarMenu>

        <SidebarMenu>
          <Tooltip>
            <SidebarMenuItem>
              <Link href="/customer-follow">
                <SidebarMenuButton className="font-semibold">
                  <UsersIcon className="size-4 text-green-500" />
                  客户跟进
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </Tooltip>
        </SidebarMenu>

        <SidebarMenu>
          <Tooltip>
            <SidebarMenuItem>
              <Link href="/benchmark-analysis">
                <SidebarMenuButton className="font-semibold">
                  <BarChart3Icon className="size-4 text-purple-500" />
                  对标分析
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </Tooltip>
        </SidebarMenu>

        <SidebarMenu>
          <Tooltip>
            <SidebarMenuItem>
              <Link href="/knowledge-base">
                <SidebarMenuButton className="font-semibold">
                  <BookOpenIcon className="size-4 text-yellow-500" />
                  知识库
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </Tooltip>
        </SidebarMenu>

        <SidebarMenu>
          <Tooltip>
            <SidebarMenuItem>
              <Link href="/operator">
                <SidebarMenuButton className="font-semibold">
                  <ZapIcon className="size-4 text-orange-500" />
                  操盘手
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </Tooltip>
        </SidebarMenu>

        <SidebarMenu>
          <Tooltip>
            <SidebarMenuItem>
              <Link href="/offline-marketing">
                <SidebarMenuButton className="font-semibold">
                  <StoreIcon className="size-4 text-pink-500" />
                  线下营销
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </Tooltip>
        </SidebarMenu>

        {getIsUserAdmin(user) && <AppSidebarAdmin />}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
