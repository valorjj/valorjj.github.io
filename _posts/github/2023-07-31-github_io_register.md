---
title: github.io 개설
date: 2023-07-31 06:29 +09:00
categories: ["Github"]
tags: ["blog"]
img_path: /assets/img/
image:
    path: github_text_logo.png
    alt: ""
---

# Introduction

> chirpy 테마를 적용한 github.io 블로그를 간단하게 만드는 방법
{: .prompt-info }

onenote, notion, obsidian, velog, tistory, 네이버 블로그, 애플 메모, 굿노트, bear, typora 등 유목민 생활을 하다가 이제는 정착하고자 github.io 를 만들어보고자 결심했다. 여러 번 옮겨다니느라 수도 없이 많던 노트들이 다 어디로 갔는지도 모르겠다.

<details>
    <summary>갈아타는 이유</summary>
    1. 고정되어 있긴 하지만 도메인을 돈 주고 사지 않아도 깃에서 제공해준다.
    2. 마크다운 형식이다. 
    3. 수 많은 테마가 이미 존재한다.
    4. 깃허브에서 Actions 를 제공해서 CD/CI 가 간편하다. 그리고 버전 관리를 깃 베이스로 한다.
    5. Ruby, Gem 등 생소한 프레임워크여서 흥미가 생긴다.
    6. 구글에 참고할 자료가 널렸다.
    7. velog 도 마크다운으로 메모하기가 너무 편한데 뭔가 고정된 형식이 아쉽다.
    8. notion 너무 좋지만 뭔가 깔끔하게 정제된 자료를 archive 하는 용도로 사용하고 싶다. 
    9. obsidian 도 거의 방식은 유사하지만 홈페이지에 올릴려면 비용이 비싸다.
    10. 아예 스프링 부트, 리액트로 홈페이지를 제작해볼까 했지만 프론트 만드는 시간과 호스팅 비용이 아깝다. 나는 단순 기록만을 원한다.
    11. Liquid 문법이 JSP, vue 같은 느낌이 있어 재밌다. 간단한 제어가 가능하다. (이건 obsidian 도 native js 를 실행할 수 있기에 동일하다.)
</details>


## 설치

> 환경은 macOS
{: .prompt-danger }

일단 [이 사이트](https://github.com/cotes2020/chirpy-starter) 로 접속한다. 그리고 `Installation` 에 `use this template` 을 누른다. 

> 주의사항<br />
> - chirpy github repository 를 clone, fork 하지 않고 template 을 사용한다. <br />
> - Repository name 은 ${깃허브아이디}/github.io 로 한다.<br />
> - 로컬에서 vscode 로 작업하기 때문에 git clone 한다. <br />
> - 로컬에서 실행하기 위해서는 Ruby 를 설치한다. <br />
> - _config.yml 변경 후에는 중단, 재시작이 필요하다.
{: .prompt-warning }

VS Code 에서 글 작성 -> git push -> github 가 배포 하는 간단한 과정이다. Markdown 파일을 HTML 파일로 만들고, 스타일도 입혀주는 Jekyll 을 사용한다. Jekyll 은 Ruby 기반에서 돌아가기 때문에, 로컬 환경에 Ruby 가 필요하다. 

위에서 Template 으로 Chirpy 를 받았다면 깨끗하게 초기화가 된 상태기 때문에 초기화해주지 않아도 된다. 파일 중에 Gem 이라는 파일을 찾아서 다음 코드를 한줄 추가해주자.

`gem 'jekyll-compose', group: [:jekyll_plugins]`

그리고 터미널 창을 열어서, 다음 명령어를 입력한다.

`bundle`

Gem 은 Ruby 환경에서 사용되는 오픈소스 라이브러리이고, bundle 과정을 통해서 내려받는다. 

## _config.yml

글 작성하기 전에, _config.yml 파일을 열어서 몇 가지 설정을 해줘야 한다. 

```yaml
title: ${블로그 이름} # the main title

tagline: ${블로그 서브 이름} # it will display as the sub-title

description: >- # used by seo meta and the atom feed
  ${블로그 설명}

timezone: Asia/Seoul

# fill in the protocol & hostname for your site, e.g., 'https://username.github.io'
url: "https://${깃허브 아이디를 넣습니다.}.github.io"

github:
  username: ${깃허브 아이디를 넣습니다.} # change to your github username

comments:
  active: giscus # The global switch for posts comments, e.g., 'disqus'.  Keep it empty means disable
  # # The active options are as follows:
  disqus:
    shortname: # fill with the Disqus shortname. › https://help.disqus.com/en/articles/1717111-what-s-a-shortname
  # utterances settings › https://utteranc.es/
  utterances:
    repo: # <gh-username>/<repo>
    issue_term: # < url | pathname | title | ...>
  # Giscus options › https://giscus.app
  giscus:
    repo: ${깃허브 아이디를 넣습니다.}/${깃허브 아이디를 넣습니다.}.github.io
    repo_id: ${giscus 에서 알려주는 값}
    category: ${giscus 에서 선택한 카테고리}
    category_id: ${giscus 에서 카테고리 선택하면 알려주는 값}
    mapping: # optional, default to 'pathname'
    input_position: # optional, default to 'bottom'
    lang: # optional, default to the value of `site.lang`
    reactions_enabled: # optional, default to the value of `1`


```

100% 파악한 것은 아니다. 하지만 시행착오 겪으며 알게된 사실은 다음과 같다.

1. _config.yml 에 설정한 값으로 build 한다.
2. _site/posts 폴더 아래, .md 파일의 YYYY-MM-DD-${문서이름} 에서 ${문서이름} 의 폴더가 생기고, 그 안애 index.html 파일이 생긴다. 그러니 내가 만든 .md : 생성된 index.html = 1 : 1 이다. 
3. 생성된 index.html 파일을 열어보면, .md 파일이 .html 파일로 변환되었고 css 와 js 파일들이 들어가 있다. (정적인 사이트를 jekyll 이 만들어주는 것이다.)
4. 오류가 발생하면, 경로 문제일 확률이 높다. _posts 는 로컬, _site 는 서버 를 알고 있어야 하고 다행이 jekyll 은 link, include, collection, post_url 등 편리한 기능을 제공한다.




## post 작성

`YYYY-MM-dd-${파일이름}.md` 형식을 지켜야 한다. ex) `2023-07-31-TEST.md`

### front matter

`.yml` 형식으로 몇 가지 값을 설정해주어야 한다. 해당 값은 liquid 문법으로 본문 안에서 꺼내 쓸 수 있다. 

간단하게 아래와 같은 형식이다. .md -> .html 변환을 위해서 title, date 가 필수값이고 나머지는 옵션이다.

```yaml
---
title: Opaque 토큰 이해
date: 2023-07-28 18:42 +09:00
categories: ["Spring Security","OAuth2.0"]
tags: ["jwt", "opaque"]
img_path: /assets/img/
image:
    path: jwt_logo.png
    alt: ""
---
```

### local 실행

Ruby 를 설치했고, bundle 명령어를 실행 했다면, 다음 명령어로 로컬 환경에서 작성한 글을 미리 볼 수 있다.

`bundle exec jekyll s`

이후에 `localhost:4000` 으로 들어가면 작성한 글을 확인할 수 있다. 에러가 발생한다면 메시지를 복사해서 구글에 검색해보자. jekyll 은 예전부터 개인 블로그 개설 시 사용한 사람이 상당 수 있기 때문에 stackoverflow 에 질문 & 답변의 흔적이 많이 남아있다.

### .pretterignore

혹시, prettier 때문에 자동 수정되는 것을 막아야 한다면 `.prettierignore` 파일을 _config.yml 과 동일한 경로에 생성해준다. 

다음과 같이 입력해주면 된다. 개인적으로 마크다운 파일에서는 .info, .warning 이렇게 색깔로 스타일이 입혀진 prompt 의 사용을 선호하는데 자동 수정이 되면 해당 기능을 쓸 수가 없다. 

```bash
# Ignore Markdown files:
**/*.md
```

chirpy 에서는 다음과 같이 사용하면 된다.

```markdown

> 안녕 이건 테스트야
{: .prompt-info }

```

> 안녕 이건 테스트야
{: .prompt-info }


### git 배포

github 는 actions 를 지원해서 스크립트를 함께 전송하면 CD/CI 를 해준다. 

`_github/workflows` 폴더 안에 있는 파일을 살펴보자.

아래와 같은 작업을 하라고 명시되어 있다. 

- ubuntu 서버에서 Ruby 설치
- jekyll 로 빌드

```yaml
name: "Build and Deploy"
on:
  push:
    branches:
      - main
      - master
    paths-ignore:
      - .gitignore
      - README.md
      - LICENSE

  # Allows you to run this workflow manually from the Actions tab
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

# Allow one concurrent deployment
concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v3
        with:
          fetch-depth: 0
          # submodules: true
          # If using the 'assets' git submodule from Chirpy Starter, uncomment above
          # (See: https://github.com/cotes2020/chirpy-starter/tree/main/assets)

      - name: Setup Pages
        id: pages
        uses: actions/configure-pages@v3

      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: 3   # reads from a '.ruby-version' or '.tools-version' file if 'ruby-version' is omitted
          bundler-cache: true

      - name: Build site
        run: bundle exec jekyll b -d "_site${{ steps.pages.outputs.base_path }}"
        env:
          JEKYLL_ENV: "production"

      - name: Test site
        run: |
          bundle exec htmlproofer _site --disable-external --check-html --allow_hash_href

      - name: Upload site artifact
        uses: actions/upload-pages-artifact@v1
        with:
          path: "_site${{ steps.pages.outputs.base_path }}"

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2

```

### Docker 로 실행하기

아래 명령어를 통해 Docker 로 실행시킬 수 있다. 

```bash
docker run -it --rm \
    --volume="$PWD:/srv/jekyll" \
    -p 4000:4000 jekyll/jekyll \
    jekyll serve
```

Github Actions 을 이용하지 않고 본인의 로컬 서버로 블로그를 운영하는 경우 아니면 굳이? 싶다. local host 에서 작성한 글 확인을 하는 목적에 `bundle exec jekyll s` 가 간편하고 속도도 빠르다.


### liquid 문법 맛보기

JSP 와 유사한 구조를 가졌다. Type, 조건문 및 연산자, 변수 등을 지원한다. 작성된 글이 아주 많은 상황에서 글 목록을 불러온다거나, 게시글이 몇 개 작성되었는 지, 특정한 tag 가 포함된 관련 글이 뭐가 있는지 등 스크립트를 작성 할 수 있다. 

예를 들어, 작성된 글 목록을 보여주는데, 특정 카테고리만을 보여준다고 가정하자. 그리고 가장 최근에 수정된 순서로 정렬한다.

- assign: 변수를 할당
- for, endfor: 반복문
- if, endif: 조건문

{% raw %}
```liquid
{% assign posts = site.posts | sort: 'date' | reverse %}
{% for post in posts %}
    {% for category in post.categories %}
        {% if category == "Spring Security" %}
            <li>
                <a href="{{ post.url }}">{{ post.title }}</a>
            </li>
        {% endif %}
    {% endfor %}
{% endfor %}
```
{% endraw %}

또한, 파이프 라인을 이용해서 filter 를 걸어줄 수 있다.  ([여기](https://jekyllrb.com/docs/liquid/filters/))


## 출처
1. https://jekyllrb.com/docs/configuration/front-matter-defaults/
2. https://learntheweb.courses/topics/jekyll-cheat-sheet/

<!-- This page was last updated at {{ "now" | date: "%Y-%m-%d %H:%M" }}. -->