import { branches } from "../src/content/branches";
import { brandCopy } from "../src/content/brand";
import { classes } from "../src/content/classes";
import { commonLinks } from "../src/content/links";
import { cooperationInstitutions, cooperationPrograms } from "../src/content/cooperation";
import { designers } from "../src/content/designers";
import { instructors } from "../src/content/instructors";
import { jobs } from "../src/content/jobs";
import { styles } from "../src/content/styles";
import { validateContent } from "../src/lib/content-validation";

const errors = validateContent({
  brand: brandCopy,
  branches,
  designers,
  styles,
  instructors,
  classes,
  jobs,
  cooperation: cooperationPrograms,
  cooperationInstitutions,
  links: commonLinks,
});

if (errors.length > 0) {
  console.error("콘텐츠 검증에서 오류를 발견했습니다.");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("콘텐츠 검증 완료: 공개 후보의 ID, 관계, 필수값, URL, 일정 규칙을 확인했습니다.");
  console.log("운영 자료가 pending인 콘텐츠와 draft 항목은 공개 조회에서 제외됩니다.");
}
