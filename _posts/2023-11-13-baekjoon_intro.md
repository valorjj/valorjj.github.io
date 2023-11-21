---
title: 백준 알고리즘 문제 풀기 - 기초
date: 2023-11-11 00:00 +09:00
categories: ['algorithm']
tags:
  - 'tutorial'
image:
  path: spring.png
  alt: ''
---

<!-- @format -->

`프로그래머스`와 다르게 `백준`에서 알고리즘 문제를 풀고 제출하기 위해서는 사전 작업이 필요하다. 익숙하지 않으면 시간이 좀 걸린다.

```java

/*
* 클래스는 Main 단 1개만 존재해야함
* */
public class Main {
	/*
	* 각종 static 변수 선언
	* */
	public static int[] stack;
	public static int size = 0;

	/*
	* 아래 메서드도 고정
	* */
	public static void main(String[] args) throws Exception {
		BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
		StringBuilder sb = new StringBuilder();
		StringTokenizer st;


	}
}
```

간단하게 연습문제로 [10828번 스택문제](https://www.acmicpc.net/problem/10828) 를 풀어본다.

```text
14
push 1
push 2
top
size
empty
pop
pop
pop
size
empty
pop
push 3
empty
top
```

백준 문제를 보면 전부 다 이렇게 주어진다.

- 첫번째 ~ 두번째 줄은 총 명령 횟수, 배열의 크기 등 중요한 설정 정보
- 다음 줄 부터 수행해야 할 명령어가 나와있다.

전체 프로그램이 동작하는 시간 기준이 타이트하기 때문에 `BufferedReader`, `BufferedWriter`, `StringBuilder`, `StringTokenizer` 등을 잘 활용해야 한다.

<script src="https://gist.github.com/valorjj/b8edbec720f9c9b4c71c3860bae027a4.js"></script>

이런 종류의 문제는 굳이 코드 작성하지 않아도 답이 떠오를 만큼 쉬운 편에 속하지만 직접 풀어보면서 I/O 처리와 함께 불필요한 코드 줄이는 것을 훈련하는 것의 중요한 첫걸음이라고 생각한다.

또한 `Array` 를 사용하지 않고, `Stack` 을 바로 사용한다면 `pop`, `empty` 이런 메서드를 직접 구현할 필요가 없어진다. 하지만, Array 를 통해 Stack 을 구현하면서, 메서드 내에서 포인터가 가르키는 인덱스, 예외 처리 등을 생각해 볼 수 있다.

Queue, HashSet, Deque, PriorityQueue, Binary Tree 등 자료 구조를 배열로 한땀 한땀 구현해보면 해당 자료구조에 대해서 더 깊은 이해와 응용이 가능하다고 생각한다.

특히 이진 트리 구조로 SQL 이 동작하기 때문에 여러 번 반복해본다.
