"use client"

import type { CSSProperties } from "react"
import type { Components } from "@json-render/react"

import type { catalog } from "../catalog"

type SiteComponentKeys =
  | "SiteNav"
  | "Hero"
  | "StaffGrid"
  | "ServiceAccordion"
  | "HoursTable"
  | "PolicyBlock"
  | "BookingCTA"
  | "SiteFooter"
  | "Container"

export const siteComponents: Pick<Components<typeof catalog>, SiteComponentKeys> = {
  SiteNav: ({ props }) => (
    <nav
      aria-label="Site"
      className="sticky top-0 z-20 flex items-center justify-between gap-4 py-4 border-b border-[var(--shell-border)] bg-[var(--shell-bg)] backdrop-blur-[12px]"
    >
      <div className="inline-flex items-center gap-3.5 min-w-0 text-[var(--shell-text)] no-underline">
        {props.logoUrl && (
          <img
            alt={`${props.shopName} logo`}
            className="w-auto max-w-32 h-11 object-contain"
            src={props.logoUrl}
          />
        )}
        <span className="text-[clamp(1.3rem,2vw,1.7rem)] leading-[1.1] text-[var(--shell-accent)] text-balance">
          {props.shopName}
        </span>
      </div>
      <ul className="flex flex-wrap items-center justify-end gap-y-2 gap-x-5">
        {props.links.map((link) => (
          <li key={`${link.href}-${link.label}`} className="list-none">
            <a
              className="text-[var(--shell-text-muted)] text-[0.95rem] no-underline hover:text-[var(--shell-text)]"
              href={link.href}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  ),

  Hero: ({ props }) => (
    <header className="grid grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] gap-8 items-center py-16 pb-[4.5rem] border-b border-[var(--shell-border)] max-sm:grid-cols-1 max-sm:py-10 max-sm:pb-12">
      <div className="max-w-[42rem]">
        <h1 className="m-0 text-[clamp(3rem,8vw,5.8rem)] leading-[0.97] text-[var(--shell-text)] text-balance">
          {props.headline}
        </h1>
        <p className="max-w-[34rem] mt-6 text-[clamp(1rem,2vw,1.25rem)] leading-[1.8] text-[var(--shell-text-muted)] text-pretty">
          {props.subtitle}
        </p>
        {props.ctaLabel && props.ctaHref && (
          <a
            className="inline-flex items-center justify-center min-h-[3.25rem] mt-8 px-6 py-3.5 border border-transparent rounded-full bg-[var(--shell-accent)] text-[var(--shell-accent-contrast)] text-[0.95rem] font-semibold no-underline shadow-[0_14px_30px_rgba(199,164,106,0.18)] hover:bg-[var(--shell-accent-strong)] hover:-translate-y-px"
            href={props.ctaHref}
          >
            {props.ctaLabel}
          </a>
        )}
      </div>
      {props.coverImageUrl && (
        <img
          alt={props.headline}
          className="w-full min-h-[22rem] max-sm:min-h-64 border border-[var(--shell-border)] rounded-[2rem] bg-gradient-to-b from-[rgba(228,231,239,0.03)] to-[rgba(228,231,239,0.01)] object-cover shadow-[var(--shell-shadow)]"
          src={props.coverImageUrl}
        />
      )}
    </header>
  ),

  StaffGrid: ({ props }) => (
    <section className="py-16">
      <div className="grid grid-cols-3 max-sm:grid-cols-1 gap-5">
        {props.staff.map((member) => (
          <article
            key={member.name}
            className="grid grid-cols-[auto_minmax(0,1fr)] max-sm:grid-cols-[3.75rem_minmax(0,1fr)] gap-4 items-start p-[1.4rem] border border-[var(--shell-border)] rounded-[var(--shell-radius-lg)] bg-[var(--shell-bg-elevated)]"
          >
            {member.photoUrl && (
              <img
                alt={member.name}
                className="w-20 h-20 max-sm:w-[3.75rem] max-sm:h-[3.75rem] rounded-full object-cover bg-[rgba(199,164,106,0.14)]"
                src={member.photoUrl}
              />
            )}
            <div className="min-w-0">
              <h2 className="m-0 text-[1.15rem] leading-[1.2] text-[var(--shell-text)] text-balance">
                {member.name}
              </h2>
              {member.role && (
                <p className="mt-1 text-[0.95rem] text-[var(--shell-accent)]">
                  {member.role}
                </p>
              )}
              {member.bio && (
                <p className="mt-3.5 text-[var(--shell-text-muted)] text-pretty">
                  {member.bio}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  ),

  ServiceAccordion: ({ props }) => (
    <section className="grid gap-4 py-16">
      {props.categories.map((category) => (
        <div
          key={category.name}
          className="border border-[var(--shell-border)] rounded-[var(--shell-radius-lg)] bg-[var(--shell-bg-soft)] overflow-hidden"
        >
          <h2 className="m-0 px-[1.4rem] py-[1.2rem] border-b border-[var(--shell-border)] text-[var(--shell-accent)] text-[1.1rem] leading-[1.2]">
            {category.name}
          </h2>
          <div className="grid">
            {category.services.map((service) => (
              <article
                key={`${category.name}-${service.name}`}
                className="px-[1.4rem] py-4 pb-[1.1rem] [&+&]:border-t [&+&]:border-[var(--shell-border)]"
              >
                <div className="flex items-baseline justify-between gap-4 max-sm:grid">
                  <h3 className="text-base font-semibold text-[var(--shell-text)]">
                    {service.name}
                  </h3>
                  <div className="inline-flex items-center gap-3.5 justify-end max-sm:justify-start flex-wrap text-[var(--shell-text-subtle)] text-right max-sm:text-left whitespace-nowrap max-sm:whitespace-normal">
                    <span className="text-[0.95rem] leading-[1.4] tabular-nums">
                      {service.duration}
                    </span>
                    <span className="text-[0.95rem] leading-[1.4] tabular-nums text-[var(--shell-accent)]">
                      {service.price}
                    </span>
                  </div>
                </div>
                {service.description && (
                  <p className="mt-2.5 max-w-[42rem] text-[var(--shell-text-muted)] text-pretty">
                    {service.description}
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>
      ))}
    </section>
  ),

  HoursTable: ({ props }) => (
    <section className="py-12">
      <table className="grid border border-[var(--shell-border)] rounded-[var(--shell-radius-lg)] bg-[var(--shell-bg-soft)] overflow-hidden">
        <tbody>
          {props.hours.map((entry) => (
            <tr
              key={entry.day}
              className="flex items-center justify-between gap-4 px-5 py-4 tabular-nums [&+&]:border-t [&+&]:border-[var(--shell-border)]"
            >
              <th className="text-[var(--shell-text-muted)] font-normal" scope="row">
                {entry.day}
              </th>
              <td className="text-[var(--shell-accent)] text-right">
                {entry.closed ? "Closed" : `${entry.open} - ${entry.close}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  ),

  PolicyBlock: ({ props }) => (
    <section className="px-5 py-[1.1rem] border border-[var(--shell-border)] rounded-[var(--shell-radius-md)] bg-[var(--shell-bg-soft)]">
      <h3 className="m-0 text-[var(--shell-accent)] text-[0.82rem] leading-[1.3] uppercase">
        {props.title}
      </h3>
      <p className="mt-2 text-[var(--shell-text-muted)] text-pretty">
        {props.body}
      </p>
    </section>
  ),

  BookingCTA: ({ props }) =>
    props.variant === "sticky" ? (
      <div className="fixed left-0 right-0 bottom-0 z-30 flex items-center justify-center px-4 py-3.5 pb-[calc(0.9rem+env(safe-area-inset-bottom))] bg-[var(--shell-bg)] border-t border-[var(--shell-border)] backdrop-blur-[12px]">
        <a
          className="inline-flex w-full max-w-[30rem] items-center justify-center min-h-14 px-6 py-4 rounded-full bg-[var(--shell-accent)] text-[var(--shell-accent-contrast)] text-[0.95rem] font-bold no-underline shadow-[0_16px_36px_rgba(199,164,106,0.2)] hover:bg-[var(--shell-accent-strong)] hover:-translate-y-px"
          href={props.href}
        >
          {props.label}
        </a>
      </div>
    ) : (
      <section className="flex items-center justify-center py-12 pb-16">
        <a
          className="inline-flex w-full max-w-[30rem] items-center justify-center min-h-14 px-6 py-4 rounded-full bg-[var(--shell-accent)] text-[var(--shell-accent-contrast)] text-[0.95rem] font-bold no-underline shadow-[0_16px_36px_rgba(199,164,106,0.2)] hover:bg-[var(--shell-accent-strong)] hover:-translate-y-px"
          href={props.href}
        >
          {props.label}
        </a>
      </section>
    ),

  SiteFooter: ({ props }) => (
    <footer className="flex items-center justify-between gap-4 px-0 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] border-t border-[var(--shell-border)] text-[var(--shell-text-subtle)] max-sm:grid max-sm:justify-start">
      <p className="text-[0.9rem]">{props.text}</p>
      <a
        className="text-[var(--shell-text-muted)] no-underline hover:text-[var(--shell-accent)]"
        href={props.linkHref}
      >
        {props.linkText}
      </a>
    </footer>
  ),

  Container: ({ props, children }) => (
    <div
      className="min-h-screen bg-[var(--shell-bg)] text-[var(--shell-text)]"
      style={props.theme as CSSProperties | undefined}
    >
      <div className="w-[min(calc(100%-2rem),var(--shell-content-width))] max-sm:w-[min(calc(100%-1.25rem),var(--shell-content-width))] mx-auto pb-28">
      {children}
      </div>
    </div>
  ),
}
