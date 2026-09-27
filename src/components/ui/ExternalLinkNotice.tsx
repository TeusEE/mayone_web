interface ExternalLinkNoticeProps {
  children?: string;
}

export function ExternalLinkNotice({ children = "선택하면 외부 서비스로 이동합니다. 새 탭에서 열립니다." }: ExternalLinkNoticeProps) {
  return <p className="externalLinkNotice">{children}</p>;
}
