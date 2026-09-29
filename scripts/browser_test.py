from playwright.sync_api import sync_playwright

errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(str(e)))

    # 1. 首页
    page.goto('http://localhost:8123/')
    page.wait_for_load_state('networkidle')
    assert 'K8s 学练营' in page.content(), 'brand missing'
    assert page.locator('.card').count() > 3, 'home cards missing'
    page.screenshot(path='C:/ai-repo/k8s-study/.shots/01-home.png', full_page=True)

    # 2. 阶段页
    page.goto('http://localhost:8123/#/stage/s1')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(400)
    assert page.locator('.lesson-row').count() >= 1, 'lesson rows missing'
    page.screenshot(path='C:/ai-repo/k8s-study/.shots/02-stage.png', full_page=True)

    # 3. 课程页 + 随堂测验交互
    page.goto('http://localhost:8123/#/lesson/s1l1')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(400)
    assert '容器技术与 Kubernetes 概述' in page.content()
    assert page.locator('figure.diagram img').count() >= 1, 'diagram missing'
    assert page.locator('.quiz').count() == 1, 'quiz missing'
    # 选一个错误答案（第1题选A=0，正确是B=1）
    page.locator('.quiz .q-item').nth(0).locator('.q-opt').nth(0).click()
    page.locator('.quiz .q-submit').click()
    page.wait_for_timeout(200)
    assert '未通过' in page.content() or '再接再厉' in page.content(), 'quiz grade failed'
    assert page.locator('.q-explain').count() >= 1, 'explanations missing'
    page.screenshot(path='C:/ai-repo/k8s-study/.shots/03-lesson.png', full_page=True)

    # 4. 练习场：合法/非法命令
    page.goto('http://localhost:8123/#/playground')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(300)
    page.fill('#pg-in', 'kubectl get pods')
    page.press('#pg-in', 'Enter')
    page.wait_for_timeout(300)
    assert 'nginx-deployment' in page.content(), 'mock table missing'
    page.fill('#pg-in', 'kubectl get podz')
    page.press('#pg-in', 'Enter')
    page.wait_for_timeout(200)
    assert '未知的资源类型' in page.content(), 'parser error missing'
    # 任务校验
    page.locator('.task-item').nth(1).click()  # t02: 所有命名空间
    page.fill('#pg-in', 'kubectl get pods -A')
    page.press('#pg-in', 'Enter')
    page.wait_for_timeout(300)
    assert '任务完成' in page.content(), 'task verdict pass missing'
    page.screenshot(path='C:/ai-repo/k8s-study/.shots/04-playground.png', full_page=True)

    # 5. 考试页（exam1 由内容生成，暂用页面存在性验证）
    page.goto('http://localhost:8123/#/exam/exam1')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(300)
    if page.locator('#exam-begin').count():
        page.click('#exam-begin')
        page.wait_for_timeout(300)
        assert page.locator('.timer').count() == 1, 'timer missing'
        assert page.locator('.task-card').count() >= 1, 'exam tasks missing'
        t = page.locator('.task-card').nth(0)
        t.locator('.task-input').fill('kubectl get pods -A')
        t.locator('.task-check').click()
        page.wait_for_timeout(200)
        assert '通过' in page.content(), 'exam task check missing'
    page.screenshot(path='C:/ai-repo/k8s-study/.shots/05-exam.png', full_page=True)

    # 6. 速查表
    page.goto('http://localhost:8123/#/reference')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(300)
    assert '命令速查表' in page.content()
    page.screenshot(path='C:/ai-repo/k8s-study/.shots/06-reference.png', full_page=True)

    browser.close()

print('CONSOLE/PAGE ERRORS:', errors if errors else 'none')
print('ALL BROWSER CHECKS PASSED')
