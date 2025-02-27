"use client"

import React, { ChangeEvent, ReactNode, useEffect, useState } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { projects } from "@/data/projects"
import FiltersIcon from "@/public/icons/filters.svg"
import {
  FilterLabelMapping,
  FilterTypeMapping,
  ProjectFilter,
  useProjectFiltersState,
} from "@/state/useProjectFiltersState"
import { useDebounce } from "react-use"

import { ProjectStatusType } from "@/lib/types"
import { cn, queryStringToObject } from "@/lib/utils"

import { Icons } from "../icons"
import Badge from "../ui/badge"
import { Button } from "../ui/button"
import { CategoryTag } from "../ui/categoryTag"
import { Checkbox } from "../ui/checkbox"
import { Input } from "../ui/input"
import { Modal } from "../ui/modal"

interface FilterWrapperProps {
  label: string
  children?: ReactNode
}

const FilterWrapper = ({ label, children }: FilterWrapperProps) => {
  return (
    <div className="flex flex-col gap-4 py-6">
      <span className="text-xl font-bold">{label}</span>
      {children}
    </div>
  )
}

export const ThemesButtonMapping: Record<
  string,
  {
    label: string
    icon: any
  }
> = {
  build: {
    label: "Build",
    icon: <Icons.hammer />,
  },
  play: {
    label: "Play",
    icon: <Icons.hand />,
  },
  research: {
    label: "Research",
    icon: <Icons.readme />,
  },
}

export const ThemesStatusMapping: Partial<
  Record<
    ProjectStatusType,
    {
      label: string
      icon: any
    }
  >
> = {
  active: {
    label: "Active",
    icon: <Icons.checkActive />,
  },
  archived: {
    label: "Archived",
    icon: <Icons.archived />,
  },
}

const FilterButtons = ({
  searchQuery,
}: {
  searchQuery?: string
}): JSX.Element => {
  const { activeFilters, onSelectTheme } = useProjectFiltersState(
    (state) => state
  )

  return (
    <div className="relative grid grid-cols-3 col-span-1 gap-2 md:gap-4 md:col-span-2 after:content-none md:after:content-[''] after:absolute after:h-11 after:w-[1px] after:bg-anakiwa-500 after:-right-[25px]">
      {Object.entries(ThemesButtonMapping).map(([key, { label, icon }]) => {
        const isActive = activeFilters?.themes?.includes(key)
        const variant = isActive ? "blue" : "white"
        return (
          <Button
            key={key}
            variant={variant}
            size="lg"
            onClick={() => {
              onSelectTheme(key, searchQuery ?? "")
            }}
          >
            <div className="flex items-center gap-2">
              {icon}
              <span>{label}</span>
            </div>
          </Button>
        )
      })}
    </div>
  )
}

export default function ProjectFiltersBar() {
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCount, setFilterCount] = useState(0)

  const { filters, toggleFilter, queryString, activeFilters, onFilterProject } =
    useProjectFiltersState((state) => state)

  useEffect(() => {
    if (!queryString) return
    router.push(`/projects?${queryString}`)
  }, [queryString, router])

  useEffect(() => {
    // set active filters from url
    useProjectFiltersState.setState({
      activeFilters: queryStringToObject(searchParams),
    })
  }, [])

  useEffect(() => {
    const count = Object.values(activeFilters).reduce((acc, curr) => {
      return acc + curr.length
    }, 0)
    setFilterCount(count)
  }, [activeFilters])

  const clearAllFilters = () => {
    useProjectFiltersState.setState({
      activeFilters: {},
      queryString: "",
      projects,
    })
    setSearchQuery("") // clear input
    router.push("/projects")
  }

  useDebounce(
    () => {
      onFilterProject(searchQuery)
    },
    500, // debounce timeout in ms when user is typing
    [searchQuery]
  )
  const hasActiveFilters = filterCount > 0 || searchQuery.length > 0

  return (
    <>
      <Modal
        title="Filters"
        footer={
          <div className="flex">
            <Button
              disabled={!hasActiveFilters}
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
            >
              Clear all
            </Button>
            <div className="ml-auto">
              <Button
                variant="black"
                size="sm"
                onClick={() => setShowModal(false)}
              >
                Show projects
              </Button>
            </div>
          </div>
        }
        open={showModal}
        setOpen={setShowModal}
      >
        {Object.entries(filters).map(([key, items]) => {
          const filterLabel = FilterLabelMapping?.[key as ProjectFilter] ?? ""
          const type = FilterTypeMapping?.[key as ProjectFilter]
          const hasItems = items.length > 0

          const hasActiveThemeFilters =
            (activeFilters?.themes ?? [])?.length > 0

          if (key === "themes" && !hasActiveThemeFilters) return null

          return (
            hasItems && (
              <FilterWrapper key={key} label={filterLabel}>
                <div
                  className={cn("gap-y-2", {
                    "grid grid-cols-1 gap-2 md:grid-cols-3":
                      type === "checkbox",
                    "flex gap-x-4 flex-wrap": type === "button",
                  })}
                >
                  {items.map((item) => {
                    const isActive =
                      activeFilters?.[key as ProjectFilter]?.includes(item)

                    if (type === "checkbox") {
                      return (
                        <Checkbox
                          key={item}
                          onClick={() =>
                            toggleFilter({
                              tag: key as ProjectFilter,
                              value: item,
                              searchQuery,
                            })
                          }
                          name={item}
                          label={item}
                          checked={isActive}
                        />
                      )
                    }

                    if (type === "button") {
                      const { icon, label } = ThemesButtonMapping[item]
                      if (!isActive) return null
                      return (
                        <div>
                          <CategoryTag
                            variant="selected"
                            closable
                            onClose={() => {
                              toggleFilter({
                                tag: "themes",
                                value: item,
                                searchQuery,
                              })
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {icon}
                              <span className="font-sans text-sm md:text-base">
                                {label}
                              </span>
                            </div>
                          </CategoryTag>
                        </div>
                      )
                    }

                    return null
                  })}
                </div>
              </FilterWrapper>
            )
          )
        })}
      </Modal>
      <div className="flex flex-col gap-6">
        <span className="text-lg font-medium">
          What do you want to do today?
        </span>
        <div className="grid items-center justify-between grid-cols-1 gap-3 md:gap-12 md:grid-cols-5">
          <FilterButtons />
          <div className="grid grid-cols-[1fr_auto] col-span-1 gap-2 md:gap-3 md:col-span-3">
            <Input
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e?.target?.value)
              }
              value={searchQuery}
              placeholder="Search project title or keyword"
            />
            <div className="flex items-center gap-3">
              <Badge value={filterCount}>
                <Button
                  onClick={() => setShowModal(true)}
                  variant="white"
                  className={cn({
                    "border-2 border-anakiwa-950": filterCount > 0,
                  })}
                >
                  <div className="flex items-center gap-2">
                    <Image src={FiltersIcon} alt="filter icon" />
                    <span className="hidden md:block">Filters</span>
                  </div>
                </Button>
              </Badge>
              <button
                disabled={!hasActiveFilters}
                onClick={clearAllFilters}
                className="hidden bg-transparent cursor-pointer md:block text-primary opacity-85 hover:opacity-100 disabled:opacity-50 disabled:pointer-events-none"
              >
                <div className="flex items-center gap-2 border-b-2 border-black">
                  <span className="text-sm font-medium">Clear all</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
