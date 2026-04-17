"use client"

import { useBoundProp } from "@json-render/react"
import { cn } from "@/lib/utils"

type StaffMember = {
  id: string
  name: string
  role?: string
  photoUrl?: string
}

type StaffPickerProps = {
  staff: StaffMember[]
  preselectedId?: string
  allowNoPreference?: boolean
}

export function StaffPicker({ staff, preselectedId, allowNoPreference }: StaffPickerProps) {
  const [selectedStaffId, setSelectedStaffId] = useBoundProp<string | undefined>(
    preselectedId,
    "selectedStaffId"
  )

  return (
    <fieldset className="mt-4 m-0 border-0 p-0">
      <legend className="mb-2 block w-full border-b border-[var(--shell-border)] pb-[0.35rem] text-[0.7rem] font-semibold uppercase tracking-[0.05em] text-[var(--shell-text-muted)]">
        Select a staff member
      </legend>
      <div className="grid gap-0 overflow-hidden rounded-[var(--shell-radius-md)] border border-[var(--shell-border)]">
        {allowNoPreference ? (
          <label
            className={cn(
              "flex cursor-pointer items-center gap-3 border-b border-b-[rgba(228,231,239,0.06)] bg-[rgba(228,231,239,0.02)] px-4 py-[0.6rem] last:border-b-0 hover:bg-[rgba(228,231,239,0.05)] before:content-[''] before:h-[1.125rem] before:w-[1.125rem] before:shrink-0 before:rounded-full before:border-2 before:border-[var(--shell-border-strong)] before:bg-transparent before:transition-[border-color,background] before:duration-150 before:ease-[var(--shell-transition)]",
              !selectedStaffId && "border-b-[var(--shell-accent)] bg-[rgba(199,164,106,0.1)] before:border-[var(--shell-accent)] before:bg-[var(--shell-accent)] before:shadow-[inset_0_0_0_3px_var(--shell-bg-elevated)]"
            )}
            htmlFor="staff-no-preference"
          >
            <input
              checked={!selectedStaffId}
              className="absolute h-px w-px overflow-hidden [clip:rect(0,0,0,0)]"
              id="staff-no-preference"
              name="selectedStaffId"
              type="radio"
              onChange={() => setSelectedStaffId(undefined)}
            />
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[rgba(228,231,239,0.08)] text-sm text-[var(--shell-text-muted)] max-sm:size-8">
              ?
            </span>
            <span className="text-[0.95rem] font-semibold text-[var(--shell-text)]">
              No preference
            </span>
          </label>
        ) : null}
        {staff.map((member) => {
          const isSelected = selectedStaffId === member.id
          return (
            <label
              key={member.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 border-b border-b-[rgba(228,231,239,0.06)] bg-[rgba(228,231,239,0.02)] px-4 py-[0.6rem] last:border-b-0 hover:bg-[rgba(228,231,239,0.05)] before:content-[''] before:h-[1.125rem] before:w-[1.125rem] before:shrink-0 before:rounded-full before:border-2 before:border-[var(--shell-border-strong)] before:bg-transparent before:transition-[border-color,background] before:duration-150 before:ease-[var(--shell-transition)]",
                isSelected && "border-b-[var(--shell-accent)] bg-[rgba(199,164,106,0.1)] before:border-[var(--shell-accent)] before:bg-[var(--shell-accent)] before:shadow-[inset_0_0_0_3px_var(--shell-bg-elevated)]"
              )}
              htmlFor={`staff-${member.id}`}
            >
              <input
                checked={isSelected}
                className="absolute h-px w-px overflow-hidden [clip:rect(0,0,0,0)]"
                id={`staff-${member.id}`}
                name="selectedStaffId"
                type="radio"
                onChange={() => setSelectedStaffId(member.id)}
              />
              {member.photoUrl ? (
                <img
                  alt={member.name}
                  className="size-10 shrink-0 rounded-full object-cover max-sm:size-8"
                  src={member.photoUrl}
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[rgba(199,164,106,0.14)] text-xs font-bold text-[var(--shell-accent)] max-sm:size-8"
                />
              )}
              <span className="flex min-w-0 items-baseline gap-[0.4rem]">
                <span className="text-[0.95rem] font-semibold text-[var(--shell-text)]">
                  {member.name}
                </span>
                {member.role ? (
                  <>
                    <span aria-hidden="true" className="text-[0.8rem] text-[var(--shell-text-subtle)]">
                      &middot;
                    </span>
                    <span className="text-[0.85rem] text-[var(--shell-text-muted)]">
                      {member.role}
                    </span>
                  </>
                ) : null}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
