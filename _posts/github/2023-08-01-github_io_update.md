---
title: github 블로그 만들기 - 수정
date: 2023-08-01 23:-00 +09:00
categories: ["Github", "Jekyll"]
tags: 
image:
    path: github_text_logo.png
    alt: ""
---

# Introduction 

liquid 로 수정 중, 삽질한 결과 기록

- Index 페이지에는 등록되어 있는 모든 포스트를 나열한다.
- 나머지 포스트에는 카테고리가 동일한 포스트를 목록으로 나열한다. 
- 다만 관련 카테고리가 아직 존재하지 않는다면, 목록을 보여주지 않는다.


## 전역변수, 지역변수

_includes 에 assign 한 변수는 전역적으로 사용된다. 지역변수, 전역변수 개념 자체가 없는 듯 하다. 

{% raw %}
```liquid

<!-- 전역 변수를 설정한 뒤, for 문을 돌면서 작성된 post 가 있다면 count 를 증가한다. -->
{% assign count = 0 %}

{% for post in posts %}

    <!-- 매칭되는 결과가 있다면 -->
    {% count = count + 1 %}

{% endfor %}

<!-- for 문을 돌면서 매칭되는 결과가 없다면, 그대로 0 이 유지된다. -->

```
{% endraw %}

하지만 예상했던 결과와 달랐다. liquid 문서를 읽어보니, _assign 한 변수에는 +1 을 할 수 없다._

대신, `increment` 태그를 사용하면, count++ 와 동일한 역할을 한다고 해서 시도해 보았지만, 실패했다.

{% raw %}
```liquid
    <!-- 매칭되는 결과가 존재하는 경우 -->
    {% increment count %}

```
{% endraw %}

전체 for 문의 결과가 9인 경우, 0 으로 선언과 동시에 초기화 되어야하는 count 값에 10 이라는 값이 들어가버린다. 아직 원인은 잘 모르겠다.

더 이상 시간을 낭비하지 않고 싶었기에 직관적이고 쉬운 길을 택했다.

> _includes/root.html <br/>
> .html 파일들을 하나로 묶어줄 root.html 을 생성했다.
{: .prompt-warning }

{% raw %}
```liquid
{% if page.title == "Index" %}
    {% include index_category.html %}
{% else %}
    {% include category.html %}
{% endif %}
```
{% endraw %}

> _includes/index_category.html
{: .prompt-warning }

{% raw %}
```liquid
<h3>전체 목록</h3>
<ul>
{% assign posts = site.posts | sort: 'last_modified_at' | reverse %}
{% for post in posts %}
    <li>
        <a href="{{ post.url }}">{{ post.title }}</a>
    </li>
{% endfor %}
</ul>
```
{% endraw %}


> _includes/category.html <br/>
> 해당 게시글과 카테고리가 동일한 글이 있다면 목록을 보여준다.
{: .prompt-warning }

{% raw %}
```liquid
{% assign this_category = page.categories[0] %}
{% assign this_sub_category = page.categories[1] %}

{% include related_post_count.html %}

{% if hasAnyPost == 1 %}
    {% include display_posts.html %}
{% elsif hasAnyPost == 0 %}
    {% include no_post.html %}
{% endif %}
```
{% endraw %}


> _includes/related_post_count.html <br/>
> hasAnyPost 라는 변수를 선언해서, 매칭되는 결과가 있다면 1, 아니면 0 을 할당했다. <br/>
> 문자열이 비었을 때 "", empty 과 아닌 nil 과 비교한다. <br/>
> Object 가 비었다면 empty 와 비교한다. <br/>
{: .prompt-warning }

{% raw %}
```liquid
{% assign hasAnyPost = 0 %}
{% for post in site.posts %}
    {% assign post_category = post.categories[0] %}
    {% assign post_sub_category = post.categories[1] %}
    <!-- 메인, 서브 카테고리가 모두 일치하는 경우 -->
    {% if 
        this_category == post_category and 
        this_sub_category == post_sub_category
    %}
        {% unless 
            this_category == nil or 
            post_category == nil
        %}
            {% unless 
                this_sub_category == nil or
                post_sub_category == nil
            %}
                {% assign hasAnyPost = 1 %}
            {% endunless %}
        {% endunless %}
    <!-- 메인 카테고리만 일치하는 경우 -->
    {% elsif this_category == post_category %}
        {% unless 
            this_category == nil or
            post_category == nil 
        %}
            {% assign hasAnyPost = 1 %}
        {% endunless %}
    <!-- 메인 카테고리, 서브 카테고리가 일치하는 경우 -->
    {% elsif 
        this_category == post_sub_category and
        this_sub_category == post_category
    %}
        {% unless 
            this_sub_category == nil or
            post_category == nil 
        %}
            {% unless 
                this_category == nil or
                post_sub_category == nil    
            %}
                {% assign hasAnyPost = 1 %}
            {% endunless %}
        {% endunless %}
    <!-- 서브 카테고리만 동일한 경우 -->
    {% elsif this_sub_category == post_sub_category %}
        {% unless 
            this_sub_category == nil or
            post_sub_category == nil
        %}
            {% assign hasAnyPost = 1 %}
        {% endunless %}
    {% endif %}
{% endfor %}
```
{% endraw %}


> _includes/display_posts.html <br/>
> hasAnyPost 가 1 이라면 매칭되는 결과가 1개 이상 있다는 뜻이다. <br/>
> 1개 이상 있는 경우, 카테고리가 동일한 게시글을 보여준다.
{: .prompt-warning }

{% raw %}
```liquid
<details>
    <summary>관련 포스트</summary>
    <ul>
    {% assign posts = site.posts | sort: 'last_modified_at' | reverse %}    
    {% assign this_category = page.categories[0] %}
    {% assign this_sub_category = page.categories[1] %}
    <p>카테고리: {{ this_category }} {% unless this_sub_category == nil %}, {{ this_sub_category }} {% endunless %}</p>
    {% for post in posts %}
        {% assign post_category = post.categories[0] %}
        {% assign post_sub_category = post.categories[1] %}
        <!-- 메인, 서브 카테고리가 모두 일치하는 경우 -->
        {% 
            if 
                this_category == post_category 
                    and 
                this_sub_category == post_sub_category
        %}
            {% include post_internal_link.html %}
        <!-- 메인 카테고리만 일치하는 경우 -->
        {%
            elsif this_category == post_category
        %}
            {% include post_internal_link.html %}
        <!-- 메인 카테고리, 서브 카테고리가 일치하는 경우 -->
        {%
            elsif 
                this_category == post_sub_category
                    and
                this_sub_category == post_category
        %}
            {% include post_internal_link.html %}
        {% endif %}
    {% endfor %}
    </ul>
</details>
```
{% endraw %}

> _includes/post_internal_link.html <br/>
> post.url 을 이용해서 링크를 만든다.
{: .prompt-warning }

{% raw %}
```liquid
<!-- 해당 게시글은 제외 -->
{% unless post.title == page.title %}
    <li>
        <a href="{{ post.url }}">{{ post.title }}</a>
    </li>
{% endunless %}
```
{% endraw %}

> _includes/no_post.html <br/>
> 관련 글이 하나도 없는 경우
{: .prompt-warning }

{% raw %}
```liquid
<p>아직 관련 포스트가 없습니다. 😅 </p>
```
{% endraw %}


> _layouts/post.html <br/>
> root.html 을 layout 에 포함
{: .prompt-warning }

{% raw %}
```liquid
<!-- 본문 내용 수정 -->
<div class="post-content">
    {% include root.html %}
    {{ content }}
</div>
```
{% endraw %}


## Conclude

`_includes/display_posts.html` 안에 조건문이 지저분하지만, 나중에 마음의 여유가 생기면 리팩토링을 숙제로 남겨둔다.