---
title: mariadb 설치, root 비밀번호 재설정
date: 2023-08-02 00:00 +09:00
categories: ["JPA", "DB"]
tags: ["mariadb"]
image:
    path: spring.png
    alt: ""
---

# Introduction
> 환경: m1 맥미니, Ventura 13.4.1
{: .prompt-danger }


## 설치

```shell
brew install mariadb
```

### (기존 설치된 경우) 삭제

```shell
# 1. 서비스 중지
brew services stop mariadb

# 2. 
brew uninstall mariadb

# 3. 생성된 db 삭제
sudo rm -rf /opt/homebrew/var/mysql

# 4. my.cnf | my.cnf.d | my.cnf.default 삭제
sudo rm -rf /opt/homebrew/etc/my.cnf*
```

### 비밀번호 분실한 경우 (내 경우)

> 오랜만에 접속했더니 root 비밀번호가 생각이 나지 않는다. 😅  <br/>
> 관련 포스팅 20개 넘게 시도, 모두 실패
{: .prompt-warning }

homebrew 로 mariadb 를 설치한 경우, 2개 경로만 알면된다. 

아래 경로에는 
`/opt/homebrew/opt/mariadb/bin`
![mariadb](mariadb_mysql.png)


아래 경로에는 생성한 db 가 저장된다. 
`/opt/homebrew/var/mysql`

```shell
# 1. mariadb 중지
brew services stop mariadb

# 2. 안전모드 실행
mysql.server start --skip-grant-tables

# 3. 
```