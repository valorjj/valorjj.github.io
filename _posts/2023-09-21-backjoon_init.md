---
title: 백준 - 제출하기
date: 2023-09-21 00:00 +09:00
categories: ["알고리즘", "백준"]
tags:
---

## 백준 제출하기

> Java 11


`a b` 값이 주어지고, 두 값을 더한 값을 출력하는 간단한 문제 입니다. ![문제링크](https://www.acmicpc.net/problem/1000)

백준은 속도 제한이 타이트하기 때문에 scanner 사용하면 안됩니다. Byte 단위로 읽어들여서 데이터를 저장하는 `BufferedReader`, `InputStreamReader` 두 개 조합으로 푸는것이 합리적입니다.


```java
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.IOException;
import java.util.StringTokenizer;

public class Main {
    public static void main(String[] args) throws IOException {
    
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(System.out));
        
        String str = br.readLine();
        StringTokenizer st = new StringTokenizer(str, " ");
        int a = Integer.parseInt(st.nextToken());
        int b = Integer.parseInt(st.nextToken());
        
        bw.write(String.valueOf(a + b));
        
        bw.flush();
        
        bw.close();
        br.close();
        
        
    }
}

```