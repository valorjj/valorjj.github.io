---
title: 프로그래머스 기초 예제
date: 2023-01-01 00:00 +09:00
categories: ['algorithm']
tags:
  - 'tutorial'
image:
  path: plogo.png
  alt: ''
---

<!-- @format -->

프로그래머스에 기초를 다지면서 풀 수 있는 시리즈가 생겨 조금씩 풀어봐야겠다.

## 문자열 잘라서 정렬하기

- 'x' 기준으로 문자열을 자른다.
  - 1트) StringTokenizer 사용
  - 2트) .split() 메서드 결과가 배열이라는 걸 기억해냄
- 사전순으로 정렬
  - 오름차순으로 정렬하라는 뜻
  - 문제에서 'x' 기준으로 나눴을 때, 알파벳이 섞여 있는 경우가 있다고 명시되어 있지 않음
    - 근데 생각해보니 문자열이 섞여 있으면 사전 순 정렬의 의미가 어색해짐
    - Comparator 로 한 단어 씩 비교하는 사전식 정렬을 원하는 거였으면 난이도가 올라가서 뺏나? 싶음 

```java
import java.util.*;

class Solution {
    
    public String[] solution(String myString) {
        String[] letters = myString.split("x");
        ArrayList<String> arr = new ArrayList<>();
        
        for (String letter : letters) {
            if (!letter.isEmpty()) {
                arr.add(letter);    
            }
        }
        
        String[] answer = arr.toArray(new String[arr.size()]);
        Arrays.sort(answer);
        
        
        
        return answer;
    }
}
```

프로그래머스는 홈페이지 자체에서 바로바로 디버깅 할 수 있는게 너무 편하다. 백준은 그런거 허용안하는 대신에 좀 더 생각하게 만드는 분위기가 있다. 

## 부분 문자열

[문제는 여기](https://school.programmers.co.kr/learn/courses/30/lessons/181842)

`.contains` 메서드가 있어서 고민할 것도 없지만 만일 직접 구현해야 했다면 어떻게 하면 좋을까? 고민하게 되는 문제이다.

```java
class Solution {
    public int solution(String str1, String str2) {
        int answer = 0;
        // str1 이 str2 에 속하는가?
        
        return (str2.contains(str1)) ? 1 : 0;
    }
}
```

## 꼬리 문자열

[문제는 여기](https://school.programmers.co.kr/learn/courses/30/lessons/181841)

```java
import java.util.*;

class Solution {
    public String solution(String[] str_list, String ex) {
        String answer = "";
        StringBuilder sb = new StringBuilder();
        for (String str : str_list){
            if(!str.contains(ex)) sb.append(str);
        }
        answer = sb.toString();
        return answer;
    }
}
```

### 반성
- 문제를 똑바로 읽자
  - 특정 문자열을 제거하고, 남은 문자열 또한 더하는 문제인 줄 알았다.

## 뒤에서 5등 위로

[문제는 여기](https://school.programmers.co.kr/learn/courses/30/lessons/181852)

```java
import java.util.*;

class Solution {
    public int[] solution(int[] num_list) {
        List<Integer> list = new ArrayList<>();
        Arrays.sort(num_list);
        
        for(int i = 5; i < num_list.length; i++) {
            list.add(num_list[i]);
        }
        
        int[] answer = new int[list.size()];
        
        for (int j = 0; j < list.size(); j++) {
            answer[j] = list.get(j);
        }
        
        return answer;
    }
}
```

## 배열의 원소 삭제하기

[문제는 여기](https://school.programmers.co.kr/learn/courses/30/lessons/181844)


```java
import java.util.*;
import java.util.stream.*;


class Solution {
    public int[] solution(int[] arr, int[] delete_list) {
        List<Integer> list = new ArrayList<>();
        for(int i=0; i<arr.length; i++) {
            for (int j=0; j<delete_list.length; j++) {
                if (arr[i] == delete_list[j]) {
                    arr[i] = -1;
                }
            }
            list.add(arr[i]);
        }
        list = list.stream().filter(i -> i != -1).collect(Collectors.toList());
        
        int[] answer = new int[list.size()];
        
        int idx = 0;
        for(Integer i : list) {
            System.out.println(i);
            answer[idx] = i;
            idx++;
        }
        return answer;
    }
}
```
