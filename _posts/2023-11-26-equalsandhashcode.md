---
title: Equals and HashCode
date: 2023-01-01 00:00 +09:00
categories: ['springboot']
tags:
  - 'springboot'
image:
  path: spring.png
  alt: ''
---

<!-- @format -->

Java 에서 비교 연산자 `==` 은 객체의 주소값을 비교한다. `.equals` 도 주소값을 비교한다. 다만, Type 이 String 인 경우
객체의 주소가 아니라 객체의 값을 비교한다. 따라서 문자열 비교 시에는 `.equals` 메서드를 사용해야 한다.

DB 에 저장된 값은 DB 자체가 무결성을 보장하기 때문에 SQL 에서는 데이터A, 데이터B 자체가 같은지, 다른지 비교할 이유가 없다. 각기 다른 튜플로 저장되었다면
pk 를 제외한 다른 모든 값이 완전히 동일해도, 다른 데이터이다.

그럼 Java 에서는 어떨까?

```java
class Student {
  private String name;
  private Integer grade;

  public Student(
    String name,
    Integer grade
  ){
    this.name = name;
    this.grade = grade;
  }
}

public class Example {
  public static void main(String[] args) {
    Student student1 = new Student("초보", 15);
    Student student2 = new Student("고인물", 100);
    Student student3 = new Student("초보", 25);
  }
}
```

위 예제에서 생성한 `Student` 객체들은 Heap 메모리에는 각자 다른 값을 가지고 저장된다. 따라서 `==`, `.equals` 모두 동등 비교 시 `false` 이다.
객체라는 틀에서 놓고 봤을 때 당연한 결과이다. 하지만, `초보` 라는 이름을 가진 데이터들은 모두 동일하게 봐야하는 상황이 생길 수 있다.

혹은 50점 미만, 50점 이상 기준으로 객체를 구분해야하는 상황일 때는 어떻게 해야 할까? 간단한 해결책으로는 `@Getter` 를 사용해서 해당 객체에 포함된
필드 값을 비교하면 된다. 하지만, 더 효과적인 방법이 있는데 `.equals` 메서드를 `@Overriding` 하는 것이다.

```java
import java.util.Objects;

class Student {
  private String name;
  private Integer grade;

  public Student(
    String name,
    Integer grade
  ){
    this.name = name;
    this.grade = grade;
  }

  public boolean equals(Object o) {
    if (this = o) return true;
    if (!(o instanceof Student)) return false;
    Student s = (Student) o;
    return Objects.equals(this.name, s.name);
  }
}

```

```java
import java.util.Objects;

class Student {
  private String name;
  private Integer grade;

  public Student(
    String name,
    Integer grade
  ){
    this.name = name;
    this.grade = grade;
  }

  @Override
  public boolean equals(Object o) {
    if (this = o) return true;
    if (!(o instanceof Student)) return false;
    Student s = (Student) o;
    return (this.grade > 50) ? true : false;
  }
}

```

위의 예시와 같이 `java.util.Objects` 에서 지원하는 `equals` 메서드를 이용해 `Object` 의 `equals` 메서드를 재정의해서
입맛에 맞게 사용할 수 있다.

하지만! 이렇게 되면 큰 문제가 발생한다. `HashSet`, `HashMap` 등 컬렉션에 데이터를 저장하는 경우 `hashCode` 값이 다르다고 판단하여 `equals` 로는 동일하다고 결과를 내지만,
중복을 허용하지 않는 `HashSet`, `HashMap` 에 데이터가 중복되어 저장된다.

> 잠깐, `hashCode` 값이 뭔가? <br>
> 객체의 주소라고 알고 있었지만, 객체의 주소값을 변환하여 생성한 고유한 정수 값이다. <br>
> 따라서, long -> int 와 같은 다운캐스팅 시 값이 중복되는 상황이 발생할 수 있다. <br>
> 데이터의 개수가 늘어나면 충분히 hashCode 값 중복이 일어날 수 있으며, HashSet, HashMap 등의 컬렉션에서는
> 이를 방지하기 위해서 1차로 hashCode 값을, 2차로 equals 로 실제 객체 값을 비교하는 2번의 검증 과정을 거치도록 짜여져 있다.

예를 들어,

```java
Student studentA = new Student("뉴비", 10);
Student studentB = new Student("뉴비", 20);
Student studentC = new Student("고수", 90);
```

이름이 `뉴비` 라는 객체는 모두 비즈니스 로직 상 동일하다고 판단해야하는 상황을 가정해보자. `HashMap`, `HashSet` 등은 컬렉션에 데이터를 저장할 때,
가장 먼저 `hashcode` 값을 비교하고, `equals` 값을 비교해서 두 메서드 모두가 true 값을 반환하면 완전히 동일한 데이터라고 취급한다.

하지만 `equals` 메서드 만을 재정의 했으니, `hashcode` 값이 다르기 때문에 의도와는 다르게 컬렉션에 중복 저장되어 버린다. 물론, 객체에 @Getter 를 만들어
매번 getName, getGrade 등으로 비교 구문을 사용한다면 이슈를 피해갈 수 있다. 그러나 클래스 레벨에서 전처리를 한번 해주면 더 이상 신경쓰지 않아도 되지 않겠는가?

```java
import java.util.Objects;

class Student {
  private String name;
  private Integer grade;

  public Student(
    String name,
    Integer grade
  ){
    this.name = name;
    this.grade = grade;
  }

  @Override
  public boolean equals(Object o) {
    if (this = o) return true;
    if (!(o instanceof Student)) return false;
    Student s = (Student) o;
    return Objects.equals(this.name, s.name);
  }

  // Hash 값을 반환하는 코드에 특정한 필드명을 지정하여, 객체 전체가 아닌
  // 비즈니스 로직 상 중요한 의미를 갖는 필드를 한정지을 수 있다.
  @Override
  public int hashCode() {
    return Objects.hash(name)
  }
}

```

그럼 여기까지 결론은, 이름이 동일하다면 점수에 관계 없이 전부 동일한 객체로 취급된다. 개발자가 생성한 `Student` 라는 객체의 해시값을 구할 때,
`뉴비` 라는 이름을 가진 모든 객체는 동일한 해시값을 리턴하도록 재정의 했다. 여기서 그럼 고유한 해시값은 영원히 모르는가? 라는 의문이 생길 수 있고, Java 는
대비책을 마련해두었다.

`identityHashCode()` 메서드를 사용하면, 재정의된 `hashCode` 값이 아닌 고유한 객체의 해시값을 반환해준다.
