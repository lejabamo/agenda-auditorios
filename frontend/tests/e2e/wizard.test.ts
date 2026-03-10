import { test, expect } from '@playwright/test';

test.describe('Solicitud Wizard E2E', () => {
  
  test('should complete the full booking flow - Desktop', async ({ page }) => {
    // 1. Go to landing
    await page.goto('/');

    // 1.5 Handle Disclaimer Modal if present
    try {
        await page.waitForSelector('.idm-backdrop', { state: 'visible', timeout: 3000 });
        await page.getByLabel('He leído y acepto las condiciones de uso').check();
        await page.getByRole('button', { name: 'Aceptar y continuar' }).click();
        await expect(page.locator('.idm-backdrop')).not.toBeVisible();
    } catch (e) { 
        // Modal not present or already accepted
    }

    // 1.7 Navigate to next week to avoid rules
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await page.waitForTimeout(1000); 

    // 2. Click on a free slot (Green)
    const slot = page.locator('.rbc-day-slot-active').first();
    await slot.waitFor({ state: 'visible' });
    await slot.click();
    await expect(slot).toBeVisible();
    await slot.click();

    // 3. Confirm in modal
    const confirmBtn = page.getByRole('button', { name: 'Iniciar Solicitud' });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // 4. Wizard Step 1: Entity
    await expect(page).toHaveURL(/\/solicitar/);
    await page.selectOption('#dependencia-select', 'Calidad Educativa');
    await page.getByRole('button', { name: 'Continuar' }).click();

    // 5. Wizard Step 2: Confirmation
    await expect(page.getByText('Paso 2 de 4')).toBeVisible();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // 6. Wizard Step 3: Details
    await expect(page.getByText('Paso 3 de 4')).toBeVisible();
    await page.selectOption('select >> nth=0', 'Mesa Tecnica'); // Tipo de Evento
    await page.getByPlaceholder('Ej. Capacitación docente').fill('Evento de Prueba E2E Desktop');
    await page.getByPlaceholder('Propósito y agenda del evento...').fill('Esta es una prueba automatizada de Antigravity');
    await page.getByPlaceholder('Ej. 50').fill('15');
    await page.getByText('No requiero').click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // 7. Wizard Step 4: Contact
    await expect(page.getByRole('heading', { name: 'Datos del Responsable' })).toBeVisible();
    await page.getByPlaceholder('Nombre del funcionario responsable').fill('Tester Antigravity');
    await page.getByPlaceholder('Ej. Profesional Universitario').fill('QA Engineer');
    await page.getByPlaceholder('3001234567').fill('3001112233');
    await page.getByPlaceholder('nombre@entidad.gov.co').fill('qa@test.com');

    // 8. Submit
    await page.getByRole('button', { name: 'Confirmar Solicitud' }).click();

    // 9. Success
    await expect(page.getByText('solicitud de reserva del Auditorio Filomena fue registrada exitosamente')).toBeVisible({ timeout: 10000 });
  });

  test('should have mobile optimized layout - Mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Solo para vista móvil');
    
    await page.goto('/');

    // Handle Disclaimer Modal if present
    const modal = page.locator('.idm-backdrop');
    if (await modal.isVisible()) {
        await page.getByLabel('Aceptar condiciones de uso').check();
        await page.getByRole('button', { name: 'Aceptar y continuar' }).click();
        await expect(modal).not.toBeVisible();
    }
    
    // Check if header is compact
    const header = page.locator('header h1');
    await expect(header).toBeVisible();

    // Select slot
    const slot = page.locator('.rbc-day-slot-active').first();
    await slot.click();
    await page.getByRole('button', { name: 'Iniciar Solicitud' }).click();

    // Verify Sticky Footer on Step 1
    const footer = page.locator('.fixed.bottom-0');
    await expect(footer).toBeVisible();
    
    // Next
    await page.selectOption('#dependencia-select', 'Escalafón');
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Verify step indicator is visible
    await expect(page.getByText('Paso 2 de 4')).toBeVisible();
  });
});
