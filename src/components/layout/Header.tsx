"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import styles from "./Header.module.css";

const navigation = [
  { label: "SALON", description: "살롱과 지점", href: "/#hair" },
  { label: "HARU ACADEMY", description: "HARU 교육", href: "/#haru" },
  { label: "MAY.ONE MARKET", description: "메이원마켓", href: "/#market" },
  { label: "RECRUIT", description: "채용", href: "/#recruit" },
  { label: "ABOUT US", description: "브랜드 소개", href: "/#about" },
] as const;

export function Header() {
  const pathname = usePathname();
  return <HeaderFrame key={pathname} />;
}

function HeaderFrame() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  function closeMenu(restoreFocus = true) {
    setIsMenuOpen(false);
    if (restoreFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function handlePanelKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;

    const focusable = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.getAttribute("aria-hidden") !== "true");
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <>
      <header className={styles.header}>
        <div className={styles.bar}>
          <Link className={styles.brand} href="/#top" aria-label="MAY.ONE 홈">
            MAY.ONE
          </Link>
          <nav className={styles.desktopNav} aria-label="주요 메뉴">
            {navigation.map((item) => (
              <Link className={styles.navLink} href={item.href} key={item.label}>
                <span>{item.label}</span>
                <span className="srOnly">: {item.description}</span>
              </Link>
            ))}
          </nav>
          <button
            aria-controls="mobile-menu-panel"
            aria-expanded={isMenuOpen}
            aria-label="메뉴 열기"
            className={styles.menuButton}
            onClick={() => setIsMenuOpen(true)}
            ref={triggerRef}
            type="button"
          >
            <span aria-hidden="true" className={styles.menuGlyph} />
          </button>
        </div>
      </header>

      {isMenuOpen ? (
        <>
          <button
            aria-label="메뉴 닫기"
            className={styles.overlay}
            onClick={() => closeMenu()}
            tabIndex={-1}
            type="button"
          />
          <aside
            aria-label="주요 메뉴"
            aria-modal="true"
            className={styles.mobilePanel}
            id="mobile-menu-panel"
            onKeyDown={handlePanelKeyDown}
            ref={panelRef}
            role="dialog"
          >
            <div className={styles.panelHeading}>
              <span>MAY.ONE</span>
              <button
                aria-label="메뉴 닫기"
                className={styles.closeButton}
                onClick={() => closeMenu()}
                ref={closeRef}
                type="button"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <nav aria-label="모바일 주요 메뉴" className={styles.mobileNav}>
              {navigation.map((item) => (
                <Link
                  className={styles.mobileLink}
                  href={item.href}
                  key={item.label}
                  onClick={() => closeMenu(false)}
                >
                  <span>{item.label}</span>
                  <span className="srOnly">: {item.description}</span>
                </Link>
              ))}
            </nav>
          </aside>
        </>
      ) : null}
    </>
  );
}
