---
title: JsonIgnore and Transient
date: 2023-08-01 07:00 +09:00
categories: ["Spring Boot", "JPA"]
tags: ["jsonignore"]
image:
    path: jpa_logo.png
    alt: ""
---

# Introduction

> `@JsonIgnore`, `@Transient` 의 차이점
{. .prompt-tip }

`@JsonIgnore`
- 메서드나 필드가 직렬화, 역직렬화 과정에서 무시된다. 

`@Transient`
- Persist 하지 않는다.
- 직렬화, 역직렬화에는 관여하지 않는다.

## @JsonIgnore 사용법


### 필드 선언
해당 어노테이션을 필드에 선언하면 된다. 

`MemberEntity.class` 를 다음과 같이 만들었다.

```java
@Getter
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "member_tb")
public class MemberEntity extends BaseEntity {

    @Column(name = "member_name", nullable = false)
    private String name;

    @Column( name = "member_email", nullable = false, length = 20)
    private String email;

    @JsonIgnore
    @Column(name = "member_password", nullable = false, length = 60)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "member_role", nullable = false)
    private MemberEnum role;
}
```

password 에 @JsonIgnore 을 선언했고, 이제 JSON 으로 변환 시 해당 필드는 converter 에서 무시될 것이다. 테스트 클래스를 만들어 확인해보자.

`Java Object -> JSON` 직렬화는 `@RestController` 에서 `ResponseEntity` 로 응답을 보낼 때 발생한다. Controller 를 `Mock 환경`에 주입하고, `ObjectMapper` 를 통해서 `@SpringBootTest(webEnvironment = WebEnvironment.MOCK)` 를 사용하지 않고 간단한 테스트를 진행한다. 

```java
@ActiveProfiles("test")
@ExtendWith(MockitoExtension.class)
public class JsonTest extends DummyObject {

    @InjectMocks
    private MemberController memberController;
    @Spy
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("JsonIgnore 테스트")
    public void givenMember_whenSerializing_thenPasswordFiledIgnored() throws JsonProcessingException {
        // 테스트 객체 생성
        MemberEntity memberEntity = newMemberEntity("test", "test@nate.com", "1234");
        String result = objectMapper.writeValueAsString(memberEntity);

        // then
        assertThat(result.contains("name")).isEqualTo(true);
        assertThat(result.contains("password")).isEqualTo(false);
    }
}

```

![test](2023-08-03/2023-08-03-test.png)


### 클래스 선언
이 외에도, class 레벨에서 선언하는 방법도 있다. `@JsonIgnoreProperties` 어노테이션을 통해서 배열 형태로 한번에 관리하는 것이다. 

```java
@JsonIgnoreProperties({"password", "role"})
public class MemberEntity extends BaseEntity {

    // ...

    @Column(name = "member_password", nullable = false, length = 60)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "member_role", nullable = false)
    private MemberEnum role;

    // ...

}
```

### 필터 등록

아예 필터를 등록해서 사용할 수도 있다.

```java

// (1)
Member member = memberRepository.findById(id);

// (2)
SimpleBeanPropertyFilter passwordFilter = SimpleBeanPropertyFilter
    .filterOutAllExcept("id", "name", "email", "role");

// (3)
FilterProvider filters = new SimpleFilterProvider().addFilter("MemberWithoutPassword", passwordFilter);

// (4)
MappingJacksonValue mapping = new MappingJacksonValue(member);
mapping.setFilters(filters);

```

## @Trasinet 사용법

### 필드 선언

해당 필드에 선언하면 된다. `@Trasient` 어노테이션은 JPA 에서 영속성 컨텍스트에 저장된 1차 캐시를 persist 하는 단계에만 관여한다. 



## 참고자료
1. https://kwonyeeun.tistory.com/77
2. https://www.baeldung.com/java-jsonignore-vs-transient