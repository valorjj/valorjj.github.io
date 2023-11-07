---
title: k8s - 네트워크 통신 원리 학습하기
date: 2023-10-26 00:00 +09:00
categories: ["kubernetes"]
tags: 
- "networking"
image:
    path: k8s_logo.png
    alt: ""
---

# k8s 내에서 통신이 이루어지는 과정

> 쿠버네티스는 도커 네트워크 구성도를 베이스로 한다.

## 도커 컨테이너의 네트워크

![image](https://user-images.githubusercontent.com/30681841/278347682-fcb533e4-7b94-4ea0-b2e7-88be9ef75a84.png)

- docker0
- veth
- eth0

위 그림에서 알아두어야 할 개념이다.

`docker0` 는 호스트 네트워크 네임스페이스, 디폴트 네트워크 네임스페이스라고 한다. 아래 `veth0`, `veth1` 등은 컨테이너 네트워크 네임스페이스이다. 

호스트의 기본 네트워크는 `docker0` 에서 생성 및 관리되며 컨테이너의 기본 네트워크는 `veth0`, `veth1` 에서 생성되고 관리된다.

네트워크 네임스페이스는 서로 연결되기 전에는 독립적으로 동작하지만, `veth(Virtual Ethernet)` 을 통해서 네임스페이스를 연결할 수 있다. 양쪽 끝을 서로 다른 네트워크 네임스페이스에 연결하므로 이를 `veth pair` 라고 부른다.

[도커 컨테이너의 네트워킹에 관련된 공식 문서](https://docs.docker.com/engine/tutorials/networkingcontainers/) 를 통해 더 자세한 내용을 알 수 있다.

아래 그림을 보면 좀 더 명확히 이해할 수 있는데, 각각의 컨테이너 단위로 관리된다.

![image](https://user-images.githubusercontent.com/30681841/278350015-d6041f1f-005a-4929-991c-512979f30d68.png)


## 쿠버네티스의 네트워크

![image](https://user-images.githubusercontent.com/30681841/278360620-9faf0b82-f0ca-4e71-acbd-4abac745b02c.png)

`k8s` 에서 가장 작은 단위인 `Pod` 는 n개의 컨테이너로 구성된다. Pod 내에 존재하는 컨테이너들은 동일한 IP 를 부여받는데, 이는 `Pause `라는 컨테이너 덕분이다.

![image](https://user-images.githubusercontent.com/30681841/278360198-862374cf-7ff2-4cdf-b003-c538cc1c22ce.png)

[공식 문서](https://kubernetes.io/docs/concepts/services-networking/) 에 따르면 Pod 내에 존재하는 컨테이너들은 네트워크 네임스페이스를 공유하고 이는 IP 주소, MAC 주소가 동일하다는 뜻이다. 그렇기 때문에 Pod 내에서는 localhost 에서 컨테이너간 통신이 자유롭다. 동일한 이유로 컨테이너는 포트가 중복되지 않아야 한다.


[공식 문서](https://kubernetes.io/docs/concepts/cluster-administration/networking/#kubernetes-model), [관련 글](https://itnext.io/kubernetes-networking-behind-the-scenes-39a1ab1792bb#:~:text=Pod%20network%20(10.200.0.0/16)) 에 따르면 pod-to-pod, pod-to-service, container-to-container 등 각기 다른 네트워크 네임스페이스를 가진 인스턴스들을 연결시켜주는 것이 `CNI(Container Network Interface)` 이다.

***네트워크 네임스페이스***에 관해서는 [관련 문서1](https://man7.org/linux/man-pages/man7/namespaces.7.html), [관련 문서2](https://lwn.net/Articles/531114/) 에서 확인할 수 있다.

### Pod-to-Service

<img width="1002" alt="image" src="https://user-images.githubusercontent.com/30681841/278373501-bd6f8217-6f07-466c-bd3c-ec49d64d6251.png">

1. pod A 가 서비스(DNS) 콜

pod A 가 서비스(DNS) 로 콜을 보낸다. 그럼 각 컨테이너의 `/etc/resolv.conf` 에 쓰인 규칙대로 `CoreDNS` 에게 해석을 요청한다. 

`CoreDNS` 는 해당 서비스의 `Cluster IP` 를 알려준다. 해당 IP 를 이용해서 node Y 의 pod B 를 찾는다. 하지만 veth0 는 서비스의 `Cluster IP` 를 모르기 때문에, 상위 네트워크 인터페이스로 패킷을 보낸다.

기억해야할 것은 Node 와 Pod 의 네트워크 대역이 다르다는 점이다. 그렇기 때문에 Node 와 Pod 사이의 통신을 위해서 ***CNI*** 가 활약한다. CNI 는 k8s 내에서 Pod 통신을 위해 네트워크 인터페이스를 설정해주는 모듈이다.

위 그림에서 `cbr0` 은 **bridge** 를 나타내며 `veth{i}` 들의 게이트웨이 역할을 한다.

2. cbr0 --> eth0 로 가는 패킷을 인터셉트하여 NAT 하는 netfilter

![image](https://user-images.githubusercontent.com/30681841/278375715-ec7f2472-791a-442c-a24d-be9a101dd7b7.png)

해당 부분이 Pod-to-Service 에서 가장 중요하다. veth0 가 Cluster IP 를 모르고, cbr0 도 알지 못한다. 그러므로 더 상위 네트워크로 패킷을 다시 전송해야하는데, Chain Rule 에 의해 패킷의 목적지를 포워딩 해준다. Chain Rule 이 정의되어 있는 곳이 NetFilter 이다. 

NetFilter 는 리눅스 커널 기능 중 하나로 Rule-Based 패킷 처리 엔진을 뜻한다. 오가는 모든 패킷을 관찰하며 Rule 에 따라서 패킷을 포워딩 하는 기능을 한다. 이러한 NetFilter 을 사용해 Rule 을 수정하는 것이 kube-proxy 라는 k8s 의 Pod 이다.

NetFilter 가 Cluster IP 로 들어오는 패킷을 Chain Rule 에 의해서 실제 Pod 의 IP 로 DNAT 해준다. kube-proxy 는 NetFilter 의 규칙을 수정하기만 한다.

(NAT 는 Network Address Translation 의 약자이다. 네트워크 주소를 바꿔준다. SNAT 과 DNAT 이 있는데 각각 출발지 혹은 도착지의 주소를 바꾼다.)

Linux 의 user space 에서 실행되는 `iptables 인터페이스`가 netfilter 를 이용하여 패킷을 포워딩 한다. iptables 명령어를 통해서 오고 가는 ip 를 확인할 수 있다.


3, 4. Routing Table 에 따라 라우팅

<img width="1024" alt="image" src="https://user-images.githubusercontent.com/30681841/278385156-0d4384e6-e942-4c66-9cb6-812cb478ed71.png">

바로 전 단계에서 Pod 의 IP 주소를 알고나서는 각 노드의 Routing Table 에 적힌 규칙에 따라서 라우팅이 진행된다. 

5. 도착지의 NetFilter 가 cbr1 로 패킷 포워딩

<img width="475" alt="image" src="https://user-images.githubusercontent.com/30681841/278386874-9ffc9ddd-8577-4a7b-a1a1-75e55783c487.png">

`cbr0` 에서 출발한 패킷이 라우팅되어 `cbr1` 에 도착한다. 이 과정에서 역시 NetFilter 가 패킷을 관리하며 Chain Rule 에 따라서 `eth1` 에 들어온 패킷을 `cbr1` 로 포워딩한다.

<img width="482" alt="image" src="https://user-images.githubusercontent.com/30681841/278387254-537c110e-634e-483c-b475-884d5aa2e05b.png">

`cbr1` 과 `veth1` 은 동일한 네트워크 네임스페이스에 존재하며 네트워크 대역을 공유한다. 따라서 localhost 로 통신이 자유롭기 때문에 `cbr1` 에서 `veth1` 로 패킷을 전송한다.


하지만, 여기까지 살펴봤을 때 통신이 이루어지지 않는 문제는 네트워크 세팅이 아닌 걸로 결론지었다. 에러 로그에선 분명히 product-service-svc 를 찾지 못한다고 했다. Cluster IP 로 잘 등록되어 있는 Service 를 네트워크 문제 때문에 찾지 못하는 것이 아니라, 현재 OpenFeign 과 Rest Template 을 사용한 방식에 문제가 있음을 오랜 시간이 지나서야 알게 되었다.

스프링 프레임워크가 6.x.x 로 올라가면서 OpenFeign 이 아니라 새롭게 도입된 HTTP Interface 사용을 권장한다고 한다. 다만, 해당 모듈을 사용하여 k8s 정보를 연동하는 것에 관한 정보가 적다. RestTemplate 이 오랫동안 사용되었기에 설정 정보가 많지만, 분명히 현재 시점에 오류가 발생한다. 쿠버네티스 환경에서는 스프링부트 버전 업그레이드를 보류하나 싶다... 현업에서는 어떻게 잘 버무려서 사용을 하고 있을까?


```java
// 1. product-service
@HttpExchange("/product")
public interface ProductClient {

    @PutExchange("/reduceQuantity/{id}")
    Integer reduceQuantity(@PathVariable("id") Long id, @RequestParam Long quantity);

    @GetExchange("/{id}")
    ProductResponse productById(@PathVariable("id") Long id);
}

// 2. payment-service
@HttpExchange("/payment")
public interface PaymentClient {

    @PostExchange
    Response<Long> doPayment(@RequestBody PaymentRequest paymentRequest);

}

// 3. webclient 에 Bean 으로 등록
@Bean
ProductClient productClient() {
    WebClient client = WebClient.builder()
        .baseUrl("http://product-service-svc")
        .build();

    HttpServiceProxyFactory factory = HttpServiceProxyFactory.builder(WebClientAdapter.forClient(client)).build();
    return factory.createClient(ProductClient.class);
}

@Bean
PaymentClient paymentClient() {
    WebClient client = WebClient.builder()
        .baseUrl("http://payment-service-svc")
        .build();

    HttpServiceProxyFactory factory = HttpServiceProxyFactory.builder(WebClientAdapter.forClient(client)).build();
    return factory.createClient(PaymentClient.class);
}

```

간단한 예제로는 위와 같지만, 상품을 주문하는 행위는 반드시 order-service 를 거쳐서 product-service, payment-service 로 가도록 하는 구조이고 로드 밸런싱을 적용시켜야 한다.

`spring-cloud-starter-loadbalancer` 의존성을 추가하고, [예제](https://www.baeldung.com/spring-cloud-load-balancer) 에서 방법을 보았다. 

```java
// 1.
class DemoInstanceSupplier implements ServiceInstanceListSupplier {
    private final String serviceId;

    public DemoInstanceSupplier(String serviceId) {
        this.serviceId = serviceId;
    }

    @Override
    public String getServiceId() {
        return serviceId;
    }

    @Override
    public Flux<List<ServiceInstance>> get() {
        return Flux.just(Arrays
        .asList(new DefaultServiceInstance(serviceId + "1", serviceId, "localhost", 8080, false),
            new DefaultServiceInstance(serviceId + "2", serviceId, "localhost", 8081, false)));
    }
}
// 2.
@Configuration
@LoadBalancerClient(name = "example-service", configuration = DemoServerInstanceConfiguration.class)
class WebClientConfig {
    @LoadBalanced
    @Bean
    WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }
}
```

`ServiceInstanceListSupplier` 를 구현하는 구현체를 생성한다. 해당 구현체를 바탕으로 로드 밸런스를 위한 설정 클래스를 생성한다.

`ServiceInstance` 의 구현체로 `DefaultServiceInstance` 가 있는데 생성자는 다음과 같다.

```java
public DefaultServiceInstance(String instanceId, String serviceId, String host, int port, boolean secure) {
    this(instanceId, serviceId, host, port, secure, new LinkedHashMap<>());
}
```

자, 이제 혼란이 시작된다. k8s 에 배포된 서비스-to-서비스 통신이 목적이다. 

- order-service-svc
- product-service-svc
- payment-service-svc

로 배포되어 있는 인스턴스들 정보를 뭘 어떻게 넘겨야 하지?


<img width="917" alt="image" src="https://user-images.githubusercontent.com/30681841/278746894-556f2e5c-a5dc-4f4b-96e2-9e1c1e74b097.png">


로드밸런싱 설정을 하지 않고 postman 으로 api 요청을 보내면 아래와 같은 응답을 받는다.

```javascript
"message": "401 Unauthorized from PUT http://product-service-svc/product/reduceQuantity/3?quantity=1",

"path": "/order/placeOrder"
```


기존 코드는 `OAuth2AuthorizedClientManager` 를 `RestTemplate` 설정 시 인터셉터로 등록함을 알 수 있다. HTTP Interface 에서는 어떻게 하면될까? (진짜 모름)


```java
@Configuration
@Slf4j
@RequiredArgsConstructor
@EnableFeignClients(basePackages = "com.example.orderservice")
public class FeignConfig {

    private final ClientRegistrationRepository clientRegistrationRepository;
    private final OAuth2AuthorizedClientRepository oAuth2AuthorizedClientRepository;

    @Bean
    ErrorDecoder errorDecoder() {
        return new CustomErrorDecoder();
    }

    @Bean
    @LoadBalanced
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.setInterceptors(List.of(new RestTemplateInterceptor(clientManager(clientRegistrationRepository, oAuth2AuthorizedClientRepository))));
        return restTemplate;
    }


    @Bean
    public OAuth2AuthorizedClientManager clientManager(
        ClientRegistrationRepository clientRegistrationRepository,
        OAuth2AuthorizedClientRepository oAuth2AuthorizedClientRepository
    ) {
        OAuth2AuthorizedClientProvider oAuth2AuthorizedClientProvider
            = OAuth2AuthorizedClientProviderBuilder
            .builder()
            .clientCredentials()
            .build();

        DefaultOAuth2AuthorizedClientManager oAuth2AuthorizedClientManager
            = new DefaultOAuth2AuthorizedClientManager(clientRegistrationRepository,
            oAuth2AuthorizedClientRepository);

        oAuth2AuthorizedClientManager.setAuthorizedClientProvider(oAuth2AuthorizedClientProvider);

        return oAuth2AuthorizedClientManager;
    }

}
```

`Feign`과 `RestTemplate` 을 의존하는 아래 두 코드를 완전히 뜯어고치면 된다.

```java
//
@RequiredArgsConstructor
public class RestTemplateInterceptor implements ClientHttpRequestInterceptor {

    private final OAuth2AuthorizedClientManager oAuth2AuthorizedClientManager;

    @Override
    public ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution) throws IOException {
        request.getHeaders().add("Authorization",
            "Bearer " + Objects.requireNonNull(oAuth2AuthorizedClientManager
                .authorize(OAuth2AuthorizeRequest
                    .withClientRegistrationId("internal-client")
                    .principal("internal") // okta 인증 서버에 추가로 생성한 scope 값
                    .build()
                )
            ).getAccessToken().getTokenValue()
        );

        return execution.execute(request, body);
    }
}
```

```java
// 2.
@Configuration
@Slf4j
@RequiredArgsConstructor
public class OAuth2RequestInterceptor implements RequestInterceptor {

    private final OAuth2AuthorizedClientManager oAuth2AuthorizedClientManager;

    @Override
    public void apply(RequestTemplate template) {
        template.header("Authorization", "Bearer "
                + Objects.requireNonNull(oAuth2AuthorizedClientManager.authorize(OAuth2AuthorizeRequest
                    .withClientRegistrationId("internal-client")
                    .principal("internal")
                    .build())
                )
                .getAccessToken().getTokenValue()
        );
    }
}
```

```java
public ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution) throws IOException {

    OAuth2AuthorizeRequest oAuth2AuthorizeRequest = OAuth2AuthorizeRequest
    .withClientRegistrationId(clientRegistration.getRegistrationId())
    .principal(principal)
    .build();

    OAuth2AuthorizedClient client = manager.authorize(oAuth2AuthorizeRequest);

    if (isNull(client)) {
        throw new IllegalStateException("client credentials flow on " + clientRegistration.getRegistrationId() + " failed, client is null");
}
System.out.println("Bearer " + client.getAccessToken().getTokenValue() +
" - issued at : " + client.getAccessToken().getIssuedAt() +
" - expired at : " + client.getAccessToken().getExpiresAt()
);  
    request.getHeaders().add(HttpHeaders.AUTHORIZATION, "Bearer " + client.getAccessToken().getTokenValue());
    
    return execution.execute(request, body);
}
```




---

# 부록

## Private Cluster 에 승인된 네트워크 추가 

VPC network > VPC networks > Add Subnet





---
# 출처
- [https://velog.io/@seunghyeon/%EC%BF%A0%EB%B2%84%EB%84%A4%ED%8B%B0%EC%8A%A4-%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC-%EA%B5%AC%EC%84%B1%EB%8F%84](https://velog.io/@seunghyeon/%EC%BF%A0%EB%B2%84%EB%84%A4%ED%8B%B0%EC%8A%A4-%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC-%EA%B5%AC%EC%84%B1%EB%8F%84)
- [https://togomi.tistory.com/41](https://togomi.tistory.com/41)
- [https://itnext.io/kubernetes-networking-behind-the-scenes-39a1ab1792bb](https://itnext.io/kubernetes-networking-behind-the-scenes-39a1ab1792bb)
- [https://medium.com/finda-tech/kubernetes-%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC-%EC%A0%95%EB%A6%AC-fccd4fd0ae6](https://medium.com/finda-tech/kubernetes-%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC-%EC%A0%95%EB%A6%AC-fccd4fd0ae6)
- [https://btcd.tistory.com/268](https://btcd.tistory.com/268)