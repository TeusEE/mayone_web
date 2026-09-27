import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <strong className={styles.brand}>MAY.ONE</strong>
        <p className={styles.note}>SALON · EDUCATION · MARKET</p>
        <p className={styles.copyright}>© MAY.ONE BEAUTY. All rights reserved.</p>
      </div>
    </footer>
  );
}
