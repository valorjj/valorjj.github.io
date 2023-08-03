---
title: QueryDSL - 설정
date: 2023-08-02 00:00 +09:00
categories: ["Spring Boot", "JPA"]
tags: ["QueryDSL"]
image:
    path: jpa_logo.png
    alt: ""
---

# Introduction

`QueryDSL` 사용을 위한 설정을 알아본다.

## build.gradle 설정

```groovy

depenencies {

    // Spring Boot 3.x.x 버전 부터는 아래 코드 사용하면 안된다.
    // gradle 의 task 에 직접 compile 하는 과정을 등록해줘야 한다.
    // id "com.ewerk.gradle.plugins.querydsl" version "1.0.10"

    // ...

    // querydsl
    implementation "com.querydsl:querydsl-jpa:5.0.0:jakarta"
    implementation "com.querydsl:querydsl-core"
    implementation "com.querydsl:querydsl-collections"
    annotationProcessor "com.querydsl:querydsl-apt:${dependencyManagement.importedProperties['querydsl.version']}:jakarta"
    annotationProcessor "jakarta.annotation:jakarta.annotation-api"
    annotationProcessor "jakarta.persistence:jakarta.persistence-api"
    // -- querydsl --

    // ...

}

// querydsl

// 지정한 경로에 Q Class 가 생성되도록 경로를 지정한다.
def generated = 'src/main/generated'
// compileJava 시 'src/main/generated' 에 Q Class 가 생성된다. 
tasks.withType(JavaCompile).configureEach {
    options.getGeneratedSourceOutputDirectory().set(file(generated))
}

sourceSets {
    main.java.srcDirs += [generated]
}

// gradle/task/clean 실행 시, 'src/main/generated' 폴더를 지운다.
// 새로운 Entity 를 생성하고, QueryDSL 를 사용하기 위해서는 
// 서버를 중지, 재배포 해야함을 의미한다.
// Q Class 는 build, compile 시점에 생성되기 때문이다.
clean {
    delete file(generated)
} // -- querydsl --

```

![q](2023-08-03/q.png)


> 생성된 Q Class 는 git 배포 시 제외시키면 된다.
{: .prompt-danger }

