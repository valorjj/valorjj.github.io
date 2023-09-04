---
title: 스프링부트 핵심원리
date: 2023-08-01 20:05 +09:00
categories: ["Spring Boot"]
tags:
image:
  path: spring.png
  alt: ""
---

> 인프런 - 김영한님의 '스프링 핵심원리' 강의를 듣고 정리한다.

![스프링 아키텍쳐](../../assets/img/spring-architecture.png)

## 서블릿 초기화

> 초기화 테스트를 위해서 MyContainerInitV1 을 생성한다. 인터페이스를 구현하고, 인터페이스를 등록해주는 작업이 필요하다.
> META-INF/services 경로

```java
public class MyContainerInitV1 implements ServletContainerInitializer {
  @Override
  public void onStartUp(Set<Class<?>> c, ServletContext ctx) throws ServletException {

  }
}
```

> jakarta.servlet.ServletContainerInitializer 라는 파일을 생성해서, 패키지이름 + 클래스 명을 적는다.

```text
com.example.MyContainerInitV1
```

## 등록할 서블릿 생성

```java
public class HelloServlet extends HttpServlet {
@Override
      protected void service(HttpServletRequest req, HttpServletResponse resp)
  throws ServletException, IOException {
          System.out.println("HelloServlet.service");
          resp.getWriter().println("hello servlet!");
      }
}
```

## 서블릿을 직접 등록

`@WebSevlet` 을 사용하는 방식, 직접 등록하는 방식이 있다. 어노테이션 방식은 편하지만, 개발자가 중간에 개입할 여지가 없다.

> AppInit 을 생성한다.

```java
public interface AppInit {
  void onStartup(ServletContext servletContext);
}
```

> AppInit 을 상속하는 AppInitV1Servlet 을 생성한다.

```java
public class AppInitV1Servlet implements AppInit {
  @Override
  public void onStartup(ServletContext servletContext) {
    // 순수 Servlet 을 Servlet Container 에 등록한다.
    ServletRegistration.Dynamic helloServlet = servletContext.addServlet("helloServlet", new HelloServlet());
    helloServlet.addMapping("/hello-servlet");
  }
}
```

## 어플리케이션 초기화

> MyContainerInitV2 생성한다. @HandleTypes 이 추가된다.
> MyContainerInitV2.class 생성 후, META-INF/services 에 등록해준다.

```java
@HandleTypes(AppInit.class) // 인터페이스의 구현체를 찾는다.
public class MyContainerInitV2 implements ServletContainerInitializer {
  @Override
  public void onStartUp(Set<Class<?>> c, ServletContext ctx) throws ServletException {
    // log 를 통해 확인할 수 있다.

    // Set<Class<?>> c 는 reflection 을 사용해서 동적으로 인스턴스를 생성해야한다.
    // 객체의 인스턴스가 아니라 클래스에 대한 메타 정보만을 제공하기 때문이다. 내가 객체를 직접 생성해야 한다.
    // @HandleTypes(AppInit.class) 를 통해서 AppInit.class 인터페이스의 구현체 클래스를 찾아서 등록한다.
    for (ClasS<?> appInitClass : c) {
      try {
        // new AppInitV1Servlet() 과 동일한 코드이다.
        AppInit appInit = (AppInit) appInitClass.getDeclaredConstructor().newInstance();
        appInit.onStartup(ctx);
      } catch (Exception e) {
        throw new RuntimeException(e);
      }
    }
  }
}
```

### 여기까지 결론

> 서블릿 초기화 시점에 어플리케이션 초기화까지 같이 이루어지면 좋은거 아닌가? 왜 따로 따로 해줘야 하는 걸까

1. 서블릿을 초기화 하기 위해서 `ServletContainerInitializer` 인터페이스를 구현할 코드를 생성하고, `META-INF/services` 에 파일로 등록해주어야 한다. 반면, 어플리케이션 초기화는 특정 인터페이스만 구현 후, `@HandleTypes` 으로 한번에 등록할 수 있다.
2. 서블릿 컨테이너에 의존하지 않고 필요한 인터페이스를 만들 수 있다.

## 스프링 컨테이너 등록

> 의존성을 추가해준다.

```gradle
implementation 'jakarta.servlet:jakarta.servlet-api:6.0.0'
implementation 'org.springframework:spring-webmvc:6.0.4'
```

`maven`, `gradle` 같은 빌드 자동화 툴 덕분에 라이브러리의 의존성 문제를 걱정할 필요가 없다. `webmvc` 를 등록하면, `spring-core` 등 의존 관계에 있는 라이브러리가 같이 등록된다.

### 컨트롤러 생성

```java
@RestController
public class HelloController {
  @GetMapping("/hello-spirng")
  public String hello() {
    return "hello spring!";
  }
}
```

### Bean 등록

```java
@Configuration
public class HelloConfig {
  @Bean
  public HelloController helloController() {
    return new HelloController();
  }
}
```

아직 스프링 컨테이너가 존재하지 않는다. 어플리케이션 초기화와 동시에 스프링 컨테이너를 등록해보자.

### AppInitV2Spring 생성

```java
public class AppInitV2Spring implements AppInit {
  @Override
  public void onStartup(ServletContext servletContext) {
    // 1. 스프링 컨테이너를 생성한다.
   AnnotationConfigWebApplicationContext appContext = new AnnotationConfigWebApplicationContext();
   // 2. 생성한 클래스 등록한다.
   appContext.register(HelloConfig.class);
   // 3. 스프링 MVC DispatcherServlet 생성, 스프링 컨테이너에 연결한다.
   DispatcherServlet dispatcher = new DispatcherServlet(appContext);
   // 4. DispatcherServlet 등록한다.
   // 이름이 중복되면 오류가 발생하므로 오류가 발생한다.
   ServletRegistration.Dynamic servlet = servletContext.addServlet("dispatcherV2", dispatcher);
   // 5. /spring/* 요청이 DispatcherServlet 를 거치도록 한다.
   servlet.addMapping("/spring/*");
  }
}
```

![Alt text](/2023-07-27/image.png)

## 스프링 MVC 의 서블릿 컨테이너 초기화 지원

`WebApplicationInitializer` 인터페이스를 구현하면 어플리케이션이 초기화 된다.

```java
package org.springframework.web;

public interface WebApplicationInitializer {
  void onStartup(ServletContext servletContext) throws ServletException;
}
```

### AppInitV3SpringMVC

```java
public class AppInitV3SpringMvc implements WebApplicationInitializer {
  @Override
  public void onStartup(ServletContext servletContext) throws ServletException {
      // 1. 스프링 컨테이너 생성
      AnnotationConfigWebApplicationContext appContext = new
    appContext.register(HelloConfig.class);
      // 2. 스프링 MVC 디스패처 서블릿 생성, 스프링 컨테이너 연결
      DispatcherServlet dispatcher = new DispatcherServlet(appContext);
      // 3. 디스패처 서블릿을 서블릿 컨테이너에 등록 (이름 주의! dispatcherV3)
      ServletRegistration.Dynamic servlet = servletContext.addServlet("dispatcherV3", dispatcher);
      // 4. 모든 요청이 디스패처 서블릿을 통하도록 설정
      servlet.addMapping("/");
  }
}
```

![Alt text](/2023-07-27/image-1.png)

경로가 구체적인 것이 우선순위를 가진다.

### WebApplicationInitializer 의 역할

`ServletContainerInitializer` 를 구현한다. 위에서 서블릿 컨테이너 초기화 과정에서 적은 코드와 동일한 코드가 작성되어 있다.

![Alt text](/2023-07-27/image-2.png)

## WAS 가 아닌 JAR

> 스프링부트에는 톰캣이 기본적으로 내장되어 있다.
> 물론, 스프링부트가 전부 자동화 해주지만, 학습 목적으로 내장 톰캣을 직접 실행시켜보자.
> main() 만 실행시키면 알아서 작동한다.
> Tomcat 이 아닌 Jetty 등의 다른 WAS 를 사용하더라도, 스프링부트를 사용한다면 대부분 자동화된 코드를 제공한다.

`implementation 'org.apache.tomcat.embed:tomcat-embed-core:10.1.5'`

```java
public class EmbedTomcatServletMain {
  public static void main(String[] args) throws LifecycleException {
    //톰캣 설정
    Tomcat tomcat = new Tomcat();
    Connector connector = new Connector();
    connector.setPort(8080);
    tomcat.setConnector(connector);
    //서블릿 등록
    Context context = tomcat.addContext("", "/");
    tomcat.addServlet("", "helloServlet", new HelloServlet());
    context.addServletMappingDecoded("/hello-servlet", "helloServlet");
    tomcat.start();
  }
}
```

### 톰캣에 스프링 컨테이너 등록하기

```java
package hello.embed;

public class EmbedTomcatSpringMain {
  public static void main(String[] args) throws LifecycleException {
    System.out.println("EmbedTomcatSpringMain.main");
    // 1. 톰캣 설정
    Tomcat tomcat = new Tomcat();
    Connector connector = new Connector();
    connector.setPort(8080);
    tomcat.setConnector(connector);
    // 2. 스프링 컨테이너 생성
    AnnotationConfigWebApplicationContext appContext = new AnnotationConfigWebApplicationContext();
    appContext.register(HelloConfig.class); //스프링 MVC 디스패처 서블릿 생성, 스프링 컨테이너 연결
    DispatcherServlet dispatcher = new DispatcherServlet(appContext);
    // 3. 디스패처 서블릿 등록
    Context context = tomcat.addContext("", "/"); tomcat.addServlet("", "dispatcher", dispatcher); context.addServletMappingDecoded("/", "dispatcher");
    tomcat.start();
  }
}
```

## 빌드와 배포

> 커스텀 어노테이션을 사용한다.

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@ComponentScan
public @interface MySpringBootApplication {
}
```

```java
public class MySpringApplication {
  public static void run(Class configClass, String[] args) {
    System.out.println("MySpringBootApplication.run args=" + List.of(args)); //톰캣 설정
    Tomcat tomcat = new Tomcat();
    Connector connector = new Connector();
    connector.setPort(8080);
    tomcat.setConnector(connector);
    //스프링 컨테이너 생성
    AnnotationConfigWebApplicationContext appContext = new
    AnnotationConfigWebApplicationContext();
    appContext.register(configClass);
    //스프링 MVC 디스패처 서블릿 생성, 스프링 컨테이너 연결
    DispatcherServlet dispatcher = new DispatcherServlet(appContext);
    //디스패처 서블릿 등록
    Context context = tomcat.addContext("", "/"); tomcat.addServlet("", "dispatcher", dispatcher); context.addServletMappingDecoded("/", "dispatcher"); try {
    tomcat.start();
  }
}
```

위에서 만든 커스텀 어노테이션과 클래스를 활용해서 `main()` 에서 실행시켜보자.

```java
package hello;

@MySpringBootApplication
public class MySpringBootMain {
  public static void main(String[] args) {
    System.out.println("MySpringBootMain.main");
    MySpringApplication.run(MySpringBootMain.class, args);
  }
}
```

`package` 가 중요하다. `@MySpringBootApplication` 에 `@ComponentScan` 해당 어노테이션이 사용된 패키지의 하위 패키지를 스캔한다. 물론, 스캔할 패키지를 지정하는 것도 가능하다.

### @ComponentScan

```java
@Configuration
@ComponentScan(basePackages = "org.example")
public class AppConfig  {
    // ...
}
```

> 스캔을 거부할 권리

```java
@Service
@IgnoreDuringScan
public class ActorService {
  // ..
}
```

> Filter 적용도 가능하다.

```java
@Configuration
@ComponentScan(
    basePackages = "com",
    useDefaultFilters = false,
    includeFilters = {
        @Filter(
            type = FilterType.ANNOTATION,
            classes = {Component.class, Repository.class, Service.class, Controller.class}
        )
    }
)
public class AppContextConfig {
    ...
}
```

> AspectJ

```java
@Configuration
@ComponentScan(
    basePackages = "com",
    useDefaultFilters = false,
    includeFilters = {
        @Filter(
            type = FilterType.ASPECTJ,
            pattern = {"com.study.spring.*"}
        )
    }
)
public class AppContextConfig {
    ...
}
```

> 정규식

```java
@Configuration
@ComponentScan(
    basePackages = "com",
    useDefaultFilters = false,
    includeFilters = {
        @Filter(
            type = FilterType.REGEX,
            pattern = {".*component.*"}
        )
    }
)
public class AppContextConfig {
    ...
}
```

### 커스텀 어노테이션

`OOP` 언어에서는 중복된 코드를 가만히 냅두지 않는다. 클래스에 점점 어노테이션이 길게 붙는다면, 커스텀 어노테이션 사용을 고려해보자.