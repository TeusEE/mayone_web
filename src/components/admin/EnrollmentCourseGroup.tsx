"use client";

import { useId, useState } from "react";
import type { MockEnrollmentCourseGroup as CourseGroup } from "@/lib/mock-enrollment-csv";
import EnrollmentRecordCard from "@/components/admin/EnrollmentRecordCard";
import styles from "./EnrollmentCourseGroup.module.css";

export default function EnrollmentCourseGroup({ group, readOnly = false }: { group: CourseGroup; readOnly?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const headingId = useId();
  const applicantListId = useId();
  const latestApplication = group.records[0]?.submittedAt;

  return (
    <section className={styles.courseGroup} aria-labelledby={headingId}>
      <button
        className={styles.courseGroupToggle}
        type="button"
        aria-expanded={expanded}
        aria-controls={applicantListId}
        onClick={() => setExpanded((current) => !current)}
      >
        <span className={styles.courseGroupCopy}>
          <span className={styles.courseGroupLabel}>COURSE · {group.classId}</span>
          <span className={styles.courseGroupTitle} id={headingId} role="heading" aria-level={3}>
            {group.classTitle}
          </span>
        </span>
        <span className={styles.courseSummary}>
          <span className={styles.courseApplicantCount}>
            <strong>{group.records.length}</strong>
            <span>명 신청</span>
          </span>
          {latestApplication && (
            <span className={styles.latestApplication}>
              최근 신청 <time dateTime={latestApplication}>{new Intl.DateTimeFormat("ko-KR", {
                timeZone: "Asia/Seoul",
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hourCycle: "h23",
              }).format(new Date(latestApplication))}</time>
            </span>
          )}
        </span>
        <span className={styles.disclosureIndicator} aria-hidden="true">⌄</span>
      </button>

      <div className={styles.courseGroupPanel} id={applicantListId} hidden={!expanded}>
        <ol className={styles.applicantList} aria-label={`${group.classTitle} 신청자 목록`}>
          {group.records.map((record) => (
            <li key={record.submissionId}>
              <EnrollmentRecordCard record={record} groupedCourseTitle={group.classTitle} readOnly={readOnly} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
