import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, rename, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, expect } from '@playwright/test'

const outputDir = fileURLToPath(new URL('../.recording/', import.meta.url))
const sample = fileURLToPath(new URL('../samples/weekly-report/', import.meta.url))
const viewport = { width: 1100, height: 630 }
const output = join(outputDir, 'mcp-and-skill.gif')

function ffmpeg(args) {
  const result = spawnSync(process.env.FFMPEG_PATH ?? 'ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`FFmpeg exited with status ${result.status}`)
  return result.stdout
}

await mkdir(outputDir, { recursive: true })
const temporary = await mkdtemp(join(outputDir, 'extensions-'))
try {
  const browser = await chromium.launch()
  try {
    const context = await browser.newContext({ viewport, recordVideo: { dir: temporary, size: viewport } })
    const page = await context.newPage()
    const video = page.video()
    await page.goto('http://127.0.0.1:4175/?clean=1#extensions')
    const availableMcp = page.locator('[data-tab-id="mcp"][data-section-key="available"]')
    const installedMcp = page.locator('[data-tab-id="mcp"][data-section-key="installed"]')
    await expect(availableMcp.getByRole('button', { name: '日程助手', exact: true })).toBeVisible()

    await page.evaluate(() => {
      const cursor = document.createElement('span')
      cursor.setAttribute('aria-hidden', 'true')
      cursor.style.cssText =
        'position:fixed;z-index:10000;pointer-events:none;width:23px;height:28px;filter:drop-shadow(0 1px 2px #20314d50)'
      cursor.innerHTML =
        '<svg viewBox="0 0 23 28"><path d="M3 2L3 22L8 17L12 26L16 24L12 15L20 15Z" fill="#234f9d" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>'
      document.addEventListener(
        'pointermove',
        (event) => {
          const layer = document.querySelector('dialog[open]') ?? document.body
          if (cursor.parentElement !== layer) layer.append(cursor)
          cursor.style.left = event.clientX - 3 + 'px'
          cursor.style.top = event.clientY - 2 + 'px'
        },
        { capture: true },
      )
    })

    async function moveTo(target) {
      const bounds = await target.boundingBox()
      if (!bounds) throw new Error('The next recording control is outside the viewport.')
      await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2, { steps: 16 })
    }

    async function click(target) {
      await moveTo(target)
      await page.waitForTimeout(180)
      await target.click()
    }

    async function caption(ability, example = '') {
      await page.evaluate(({ ability, example }) => {
        let subtitle = document.getElementById('recording-subtitle')
        if (!subtitle) {
          subtitle = document.createElement('div')
          subtitle.id = 'recording-subtitle'
          subtitle.setAttribute('aria-hidden', 'true')
          subtitle.style.cssText =
            'position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:10001;pointer-events:none;' +
            'display:flex;align-items:center;gap:14px;padding:8px 16px;border-radius:10px;' +
            'background:#17304d;color:#fff;white-space:nowrap;font-size:23px;line-height:1.35;' +
            'box-shadow:0 3px 12px #15253c24'
        }
        const name = document.createElement('span')
        name.textContent = ability
        name.style.fontWeight = '750'
        subtitle.replaceChildren(name)
        if (example) {
          name.style.cssText += ';padding:3px 10px;border-radius:6px;background:#dceaff;color:#17304d'
          const description = document.createElement('span')
          description.textContent = example
          description.style.fontSize = '21px'
          subtitle.append(description)
        }
        const layer = document.querySelector('dialog[open]') ?? document.body
        if (subtitle.parentElement !== layer) layer.append(subtitle)
      }, { ability, example })
    }

    await page.mouse.move(1044, 570)
    await caption('统一扩展面板')
    await page.waitForTimeout(1650)

    const tag = page.getByRole('combobox', { name: '标签' })
    await caption('标签筛选', '只显示「效率工具」类扩展')
    await moveTo(tag)
    await tag.focus()
    await page.waitForTimeout(320)
    await tag.selectOption({ label: '效率工具' })
    await expect(installedMcp.getByRole('button', { name: '知识库检索', exact: true })).toBeHidden()
    await expect(availableMcp.getByRole('button', { name: '会议纪要', exact: true })).toBeVisible()
    await page.waitForTimeout(1450)

    await caption('关键词搜索', '用「日程」定位日程助手')
    const search = page.getByRole('searchbox', { name: '搜索扩展' })
    await click(search)
    await search.pressSequentially('日程', { delay: 260 })
    await expect(availableMcp.getByRole('button', { name: '会议纪要', exact: true })).toBeHidden()
    await expect(availableMcp.getByRole('button', { name: '日程助手', exact: true })).toBeVisible()
    await page.waitForTimeout(1500)

    await click(availableMcp.getByRole('button', { name: '安装', exact: true }))
    await expect(availableMcp.getByRole('progressbar')).toBeVisible()
    await caption('安装进度可视化', '进度条随安装状态更新')
    await expect(installedMcp.getByRole('switch', { name: '启用日程助手' })).toBeChecked()
    await caption('按安装状态分区', '日程助手从「可安装」移到「已安装」')
    await page.waitForTimeout(1750)

    const skillsTab = page.getByRole('tab', { name: 'Skills', exact: true })
    await caption('本地 Skill 导入', '从文件夹添加「周报整理」')
    await click(skillsTab)
    await expect(skillsTab).toHaveAttribute('aria-selected', 'true')
    await page.waitForTimeout(850)
    await click(page.getByRole('button', { name: '导入本地 Skill' }))
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await caption('本地 Skill 导入', '识别包含 SKILL.md 的技能包')
    await moveTo(dialog.getByTestId('skill-dropzone'))
    await page.waitForTimeout(1000)
    await dialog.getByLabel('Skill 包').setInputFiles(sample)
    await expect(dialog.getByTestId('skill-validation-success')).toBeVisible()
    await page.waitForTimeout(1350)
    await click(dialog.getByRole('button', { name: '确定', exact: true }))
    await expect(dialog).toBeHidden()
    const installedSkills = page.locator('[data-tab-id="skill"][data-section-key="installed"]')
    await expect(installedSkills.getByRole('switch', { name: '启用周报整理' })).toBeChecked()
    await caption('本地 Skill 导入', '周报整理已加入「已安装」')
    await page.mouse.move(1044, 550, { steps: 12 })
    await page.waitForTimeout(1900)

    const businessTab = page.getByRole('tab', { name: '业务工具', exact: true })
    await caption('自定义标签页', '应用通过 tabs 配置「业务工具」')
    await click(businessTab)
    await expect(businessTab).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('switch', { name: '启用工单查询' })).toBeChecked()
    await expect(page.getByRole('button', { name: '客户资料检索', exact: true })).toBeVisible()
    await page.waitForTimeout(2700)

    await context.close()
    const source = await video.path()
    const gif = join(temporary, 'mcp-and-skill.gif')
    // The dark heading in this crop marks the first painted workbench frame.
    const frames = ffmpeg([
      '-i',
      source,
      '-vf',
      'crop=160:85:20:10,signalstats,metadata=mode=select:key=lavfi.signalstats.YMIN:value=100:function=less,metadata=print:key=lavfi.signalstats.YMIN:file=-',
      '-frames:v',
      '1',
      '-f',
      'null',
      '-',
    ])
    const start = frames.match(/pts_time:(\d+(?:\.\d+)?)/)?.[1]
    if (start === undefined) throw new Error('No painted workbench frame found.')
    ffmpeg([
      '-ss',
      (Number(start) + 0.08).toFixed(3),
      '-i',
      source,
      '-filter_complex',
      'fps=15,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle',
      '-loop',
      '0',
      gif,
    ])
    await rename(gif, output)
    console.log(output)
  } finally {
    await browser.close()
  }
} finally {
  await rm(temporary, { recursive: true, force: true })
}
