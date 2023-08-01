---
title: Exception Handling
date: 2023-08-01 07:00 +09:00
categories: ["Spring Boot"]
tags: ["exception"]
image:
    path: spring.png
    alt: ""
---


# Introduction

> 예외가 발생하는 상황을 개발자가 컨트롤 할 수 있어야 한다.
{: .prompt-info }


## CustomException

> CustomException 에는 message 를 담는다.
{: .prompt-info }

예제로 403 권한 에러가 발생했을 시 발생시키는 에러를 만들어보자. `RuntimeException` 을 상속해서 `super()` 로 부모에게 내가 작성한 message 를 넘겨주면 된다.

```java
public class CustomForbiddenException extends RuntimeException {
    public CustomForbiddenException(String message) {
        super(message);
    }
}
```

![exception](exception.png)


예외 처리 관련 더 자세한 내용은 [이 블로그](https://sup2is.github.io/2021/03/04/java-exceptions-and-spring-transactional.html) 를 참고하면 된다. 

김영한님 강의에서 배운 점은, DB 나 네트워크에서 발생하는 예외들의 대부분은 복구가 불가능하다는 점이다. 그리고 이를 체크 예외로 보낸다면, Service, Repository, Controller 모두가 해당 예외에 의존해야 한다. 추후 변경사항이 생긴다면 유연하게 대응하는 것이 무척 번거로운 일이 될 것이다.

체크 예외는 반드시 개발자가 오류 상황 컴파일 시점에 무조건 알아야하고, 해결해야하는 상황에서 사용한다.
- 결제 실패
- 로그인 실패
- 계좌 이체 실패

등의 상황이다. 체크 예외는 `try-catch`, `throw` 를 통해서 예외 상황에 대응하는 코드를 반드시 작성해야 한다. 

반면에 언체크드 예외는 사정이 다르다. 런타임 동안에 발생하는 오류이며 오픈소스 라이브러리, JPA, 스프링 조차도 많은 오류를 런타임 오류로 설정해두었다. `@ControllerAdvice` 에서 일관성있게 처리해주면 된다. 아래 코드를 통해서 알아보자.

## CustomExceptionHandler

특정 오류가 발생했을 때, 사용자가 보는 화면에 전송되는 오류 메시지는 일관성이 있어야 한다. 때문에 DTO 를 생성해서 _ResponseEntity_ 에 담아서 보낸다.

```java
@RestControllerAdvice
public class CustomExceptionHandler {

    private final Logger log = LoggerFactory.getLogger(getClass());

    @ExceptionHandler(CustomApiException.class)
    public ResponseEntity<?> apiException(CustomApiException e) {
        log.error(e.getMessage());
        return new ResponseEntity<>(new ResponseDto<>(-1, e.getMessage(), null), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(CustomForbiddenException.class)
    public ResponseEntity<?> fobiddenException(CustomForbiddenException e) {
        log.error(e.getMessage());
        return new ResponseEntity<>(new ResponseDto<>(-1, e.getMessage(), null), HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(CustomValidationException.class)
    public ResponseEntity<?> validationApiException(CustomValidationException e) {
        log.error(e.getMessage());
        return new ResponseEntity<>(new ResponseDto<>(-1, e.getMessage(), e.getErroMap()), HttpStatus.BAD_REQUEST);
    }
}

```

### ResponseDTO

프론트로 보내는 에러 메시지를 규격화 시키는 역할을 한다. 항상 같은 형태로 에러 메시지를 감싸서 개발자가 어떤 유형의 에러가 발생했는 지 빠르게 찾을 수 있고, 프론트에서 처리도 편해진다.

```java
@RequiredArgsConstructor
@Getter
public class ResponseDto<T> {
    private final Integer code; // 1 성공, -1 실패
    private final String msg;
    private final T data;
}
```

### @ExceptionHandler(CustomException.class)

해당 어노테이션은 개발자가 생성한 특정한 CustomException 이 발생하는 경우, 어떻게 대응할 것인지 컨트롤 할 수 있게 해준다. 아래 코드에서는 간단하게 _ResponseEntity 를 만들어 내보낸다._

```java
@ExceptionHandler(CustomForbiddenException.class)
public ResponseEntity<?> fobiddenException(CustomForbiddenException e) {
    log.error(e.getMessage());
    return new ResponseEntity<>(new ResponseDto<>(-1, e.getMessage(), null), HttpStatus.FORBIDDEN);
}
```

## 예외 던지기

@Service 에서 @Repository 에 접근했는데 에러가 발생한 경우에 다음과 같이 작성해주면 된다.

```java
// 0원 체크
if (accountTransferReqDto.getAmount() <= 0L) {
    throw new CustomApiException("0원 이하의 금액을 입금할 수 없습니다");
}
```


## 유효성 검사에 적용

`@Aspect + @Valid` 를 이용해 예외 처리를 전역적으로 하도록 만들어보자. Entity 에는 @Valid 에서 지원하는 각종 유효성 검사가 걸려있다고 가정한다.

### AOP 적용

`@Service -> @Repository` 로 요청을 보낼 때, N개의 유효성 검사 중 어떤 항목이 유효성 검사를 통과하지 못했는지를 알려준다. 에러 사항을 Map 에 담는다.

> 유효성 검사 관련 에러를 처리할 클래스
{: .prompt-warning }

```java
@Getter
public class CustomValidationException extends RuntimeException {

    private Map<String, String> erroMap;

    public CustomValidationException(String message, Map<String, String> erroMap) {
        super(message);
        this.erroMap = erroMap;
    }
}
```

> AOP 를 적용할 클래스 <br/>
{: .prompt-warning }


```java
@Component
@Aspect
public class CustomValidationAdvice {

    @Pointcut("@annotation(org.springframework.web.bind.annotation.PostMapping)")
    public void postMapping() {
    }

    @Pointcut("@annotation(org.springframework.web.bind.annotation.PutMapping)")
    public void putMapping() {
    }

    @Around("postMapping() || putMapping()") // joinPoint의 전후 제어
    public Object validationAdvice(ProceedingJoinPoint proceedingJoinPoint) throws Throwable {
        Object[] args = proceedingJoinPoint.getArgs(); // joinPoint의 매개변수
        for (Object arg : args) {
            if (arg instanceof BindingResult) {
                BindingResult bindingResult = (BindingResult) arg;

                if (bindingResult.hasErrors()) {
                    Map<String, String> errorMap = new HashMap<>();

                    for (FieldError error : bindingResult.getFieldErrors()) {
                        errorMap.put(error.getField(), error.getDefaultMessage());
                    }
                    throw new CustomValidationException("유효성검사 실패", errorMap);
                }
            }
        }
        return proceedingJoinPoint.proceed(); // 정상적으로 해당 메서드를 실행해라!!
    }
}

```

> 특정한 에러 발생 시, 에러를 어떻게 처리할 지 대응하는 클래스
{: .prompt-warning }


```java
@ExceptionHandler(CustomValidationException.class)
public ResponseEntity<?> validationApiException(CustomValidationException e) {
    log.error(e.getMessage());
    return new ResponseEntity<>(new ResponseDto<>(-1, e.getMessage(), e.getErroMap()), HttpStatus.BAD_REQUEST);
}
```

> @Valid 를 사용한 인자 다음에 반드시 BindingResult 를 인자로 넣어야 유효성 검사가 작동한다. <br/>
{: .prompt-danger }

에러 객체에 대해서 다양한 메서드를 제공한다.
![binding_result](binding_result.png) 


```java
@PostMapping("/api")
public ResponseEntity<?> apiController(@RequestBody @Valid CustomDTO dto, BindingResult bindingResult) {

}
```



## 참고자료

1. https://sup2is.github.io/2021/03/04/java-exceptions-and-spring-transactional.html
2. https://techblog.woowahan.com/2606/
