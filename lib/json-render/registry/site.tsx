"use client"

import type { Components } from "@json-render/react"

import { catalog } from "../catalog"

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
    <nav aria-label="Site" className="site-nav">
      <div className="site-nav__brand">
        {props.logoUrl && (
          <img
            alt={`${props.shopName} logo`}
            className="site-nav__logo"
            src={props.logoUrl}
          />
        )}
        <span className="site-nav__name">{props.shopName}</span>
      </div>
      <ul className="site-nav__links">
        {props.links.map((link) => (
          <li key={`${link.href}-${link.label}`} className="site-nav__item">
            <a className="site-nav__link" href={link.href}>
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  ),

  Hero: ({ props }) => (
    <header className="hero">
      <div className="hero__content">
        <h1 className="hero__headline">{props.headline}</h1>
        <p className="hero__subtitle">{props.subtitle}</p>
        {props.ctaLabel && props.ctaHref && (
          <a className="hero__cta" href={props.ctaHref}>
            {props.ctaLabel}
          </a>
        )}
      </div>
      {props.coverImageUrl && (
        <img alt={props.headline} className="hero__image" src={props.coverImageUrl} />
      )}
    </header>
  ),

  StaffGrid: ({ props }) => (
    <section className="staff-grid">
      <div className="staff-grid__list">
        {props.staff.map((member) => (
          <article key={member.name} className="staff-grid__card">
            {member.photoUrl && (
              <img
                alt={member.name}
                className="staff-grid__photo"
                src={member.photoUrl}
              />
            )}
            <div className="staff-grid__content">
              <h2 className="staff-grid__name">{member.name}</h2>
              {member.role && <p className="staff-grid__role">{member.role}</p>}
              {member.bio && <p className="staff-grid__bio">{member.bio}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  ),

  ServiceAccordion: ({ props }) => (
    <section className="service-accordion">
      {props.categories.map((category) => (
        <div key={category.name} className="service-accordion__category">
          <h2 className="service-accordion__heading">{category.name}</h2>
          <div className="service-accordion__services">
            {category.services.map((service) => (
              <article
                key={`${category.name}-${service.name}`}
                className="service-accordion__service"
              >
                <div className="service-accordion__row">
                  <h3 className="service-accordion__name">{service.name}</h3>
                  <div className="service-accordion__meta">
                    <span className="service-accordion__duration">
                      {service.duration}
                    </span>
                    <span className="service-accordion__price">{service.price}</span>
                  </div>
                </div>
                {service.description && (
                  <p className="service-accordion__description">
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
    <section className="hours-table">
      <table className="hours-table__table">
        <tbody>
          {props.hours.map((entry) => (
            <tr key={entry.day} className="hours-table__row">
              <th className="hours-table__day" scope="row">
                {entry.day}
              </th>
              <td className="hours-table__hours">
                {entry.closed ? "Closed" : `${entry.open} - ${entry.close}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  ),

  PolicyBlock: ({ props }) => (
    <section className="policy-block">
      <h3 className="policy-block__title">{props.title}</h3>
      <p className="policy-block__body">{props.body}</p>
    </section>
  ),

  BookingCTA: ({ props }) =>
    props.variant === "sticky" ? (
      <div className="booking-cta booking-cta--sticky">
        <a className="booking-cta__link" href={props.href}>
          {props.label}
        </a>
      </div>
    ) : (
      <section className="booking-cta booking-cta--inline">
        <a className="booking-cta__link" href={props.href}>
          {props.label}
        </a>
      </section>
    ),

  SiteFooter: ({ props }) => (
    <footer className="site-footer">
      <p className="site-footer__text">{props.text}</p>
      <a className="site-footer__link" href={props.linkHref}>
        {props.linkText}
      </a>
    </footer>
  ),

  Container: ({ children }) => <div className="site-landing">{children}</div>,
}
