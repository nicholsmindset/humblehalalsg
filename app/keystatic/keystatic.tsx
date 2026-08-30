"use client";

import { makePage } from "@keystatic/next/ui/app";
import Link from "next/link";
import keystaticConfig from "../../keystatic.config";
import styles from "./keystatic.module.css";

const KeystaticPage = makePage(keystaticConfig);

export default function HumbleHalalCms() {
  return (
    <>
      <KeystaticPage />
      <Link className={styles.editorialOverview} href="/admin/content">
        <span aria-hidden="true">▦</span>
        Visual blog schedule
      </Link>
    </>
  );
}
