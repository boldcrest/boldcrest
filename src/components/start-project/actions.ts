'use server'

export async function submitProjectForm(formData: FormData) {
  const data = {
    name: formData.get('name') as string,
    position: formData.get('position') as string,
    company: formData.get('company') as string,
    email: formData.get('email') as string,
    services: formData.get('services') as string,
    message: formData.get('message') as string,
    kickoff: formData.get('kickoff') as string,
    deadline: formData.get('deadline') as string,
    budget: formData.get('budget') as string,
    source: formData.get('source') as string,
  }

  // TODO: Replace with actual email service / database write
  console.log('Project form submission:', data)

  return { success: true }
}
