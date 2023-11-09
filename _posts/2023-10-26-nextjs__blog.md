---
title: Next.js 로 만드는 블로그 프로젝트
date: 2023-10-26 00:00 +09:00
categories: ["nextjs"]
tags: 
- 
image:
    path: nextlogo.png
    alt: ""
---

# Nextjs 이용한 블로그

![blog](https://user-images.githubusercontent.com/30681841/281118817-a11df869-fbbb-482a-9f85-688dd3a6ea69.png)

[Eraser 이용한 도식화](https://app.eraser.io/workspace/0mepYmD4fVptKxivrUli?origin=share)

# 깃허브 URL
[깃허브 url](https://github.com/valorjj/nextjs_blog.git)

# 

# 트러블슈팅

`TREE MISMATCH` 에러

```bash
Warning: Cannot update a component (`Router`) while rendering a different component (`LoginPage`). To locate the bad setState() call inside `LoginPage`, follow the stack trace as described in https://reactjs.org/link/setstate-in-render
    at LoginPage (webpack-internal:///(app-pages-browser)/./app/login/page.jsx:19:89)
    at StaticGenerationSearchParamsBailoutProvider (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/static-generation-searchparams-bailout-provider.js:15:11)
```

next-auth 통한 구글 로그인 과정을 실행하는 페이지이다.
TREE MISMACTH 는 Hydration 과정에서 pre-built 된 HTML 와, 완전히 생성된 페이지 간 차이가 생겨 발생하는 에러라고 한다.

로그인 페이지 > 홈 페이지 로 이동하면서 발생한다.



```javascript
"use client";

import styles from "./loginPage.module.css";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
	const { data, status } = useSession();
	const router = useRouter();

	if (status === "loading") {
		return <div className={styles.loading}>Now loading...</div>;
	}
	// 로그인에 성공한 경우, 홈으로 이동
	if (status === "authenticated") {
		router.push("/");
	}
	return (
		<div className={styles.container}>
			<div className={styles.wrapper}>
				<div
					className={styles.socialButton}
					onClick={() => signIn("google")}
				>
					Google
				</div>
				<div className={styles.socialButton}>Github</div>
				<div className={styles.socialButton}>Kakao</div>
				<div className={styles.socialButton}>Naver</div>
			</div>
		</div>
	);
}

```

---
# 출처


